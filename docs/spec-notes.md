## プロジェクト全体の既存実装機能(仕様書メモ・遡及記録)

### 会員機能
- 会員登録・ログイン(メール/パスワード、Googleログインボタン実装済み)
- プロフィール編集・本人確認書類の提出/更新(マイページ設定タブ・上書き保存・管理者再審査通知)
- 本人確認書類のAI年齢チェック機能(管理者審査画面・表裏2枚・Claude Haiku 4.5使用、承認時に承認メール送信)
- 登録フローにアバターカラー選択
- 利用規約・プライバシーポリシーへの同意取得
- profiles.id === auth.users.id(意図的設計、profiles.user_idは未使用)

### AIおすすめオプション機能(2026/7/12調査・記録)

- 月額オプション(¥1,078)。/recommend画面から利用、1日3回まで(ai_usage_logsで回数管理、暫定仕様)
- 「聞き取り」に該当するデータは2種類あり、両方ともAIの分析(プロンプト)に使われる
  1. ai_preferencesテーブル(希望年齢min/max・希望地域・絶対条件(配列)・重視ポイント(配列)・自由記述)。/recommend画面内の'preferences'ステップ(src/app/(main)/recommend/_client.tsx)でその都度入力するフォーム。POST /api/ai/preferencesでuser_idをキーにupsert(毎回上書き保存、一度きりの制限なし)
  2. profiles.desired_conditions(登録時に入力する「希望条件」欄の自由記述)。マイページ→プロフィール編集画面から他の項目と同様に編集可能
- 分析ロジック(src/app/api/ai/recommend/route.ts):
  - 自分のプロフィール(profiles全項目、desired_conditions含む)・ai_preferences・候補者一覧(異性、status IN active/approved、自分がブロックした相手は除外)をJSON化してAnthropic API(claude-opus-4-20250514)にそのままプロンプトとして渡す
  - 採点基準(合計100点):結婚希望時期の一致25点、子供の希望の一致20点、外部パートナーの一致15点、結婚後の居住形態の一致15点、家計の管理の一致10点、喫煙・飲酒の相性5点、趣味・PR・希望条件のテキスト相性分析10点。加えてai_preferencesの希望年齢範囲・居住地・絶対条件・重視ポイント・自由記述も考慮し、絶対条件に反する候補者は大きく減点する指示
  - 候補者ごとにスコア(0-100)とマッチング理由(日本語50文字程度)をAIが返し、スコア降順でソートして返却
  - isDemoMode()時はAI呼び出しをせずランダムスコア+固定理由文言(DEMO_REASONS)を返すデモモードあり
- 出力の再現性について(2026/7/12確認):anthropic.messages.create()呼び出しにtemperature(出力のばらつきを抑えるパラメータ)・seed(乱数固定値)のいずれも指定していない。そのため、自分のヒアリング内容・希望条件・候補者の顔ぶれが全く変わっていなくても、AIから返るスコア・順位・マッチング理由の文章は分析を実行するたびに変わり得る(候補者の"母集団"自体は条件が同じなら変わらない)
- 既知のUX課題(2026/7/12発見・タスク#68・#69):
  - ai_preferencesは毎回入力し直す作りで、「前回の内容を確認するだけ」「変更したい時だけ変更してそのまま分析」という導線がない
  - ヒアリング項目自体(希望年齢・希望地域・絶対条件・重視ポイント・自由記述)の内容も再度見直す予定
- 1日3回の利用制限に関する既知のUX課題(2026/7/12発見・タスク#74):制限超過時、サーバーは「1日3回までご利用いただけます」という具体的なメッセージを返すが、画面側(_client.tsx)がこれを使わず「AI分析に失敗しました。しばらく待ってから再試行してください。」という汎用エラーに置き換えてしまっており、システム障害のように見える紛らわしい表示になっている

### お問い合わせ・管理者通知メール
- /contact フォーム送信時、src/app/api/contact/route.ts が処理
- お見合い関連の管理者通知(新規申請・15分超過強制キャンセル・支払い未完了
  キャンセル・キャンセル依頼・支払いリマインド)は
  src/app/api/admin/notify/route.ts が処理
- いずれもコード上は環境変数ADMIN_EMAILを参照する設計だが、
  発見当時(2026-07-09)は本番の/var/www/amista/.envに未設定で、
  お問い合わせは amistasupport@gmail.com(フォールバック)、
  admin/notify は admin@amista.jp(フォールバック、実在しないダミー
  アドレス)と、機能ごとに異なる宛先に送られてしまっていた
- 対応:本番.envにADMIN_EMAIL=amistasupport@gmail.comを追記し、
  --force-recreateでコンテナ再起動。両機能とも
  amistasupport@gmail.com宛に統一済み(2026-07-09、動作確認済み)
- 送信元は amista <onboarding@resend.dev>(固定)、送信自体はResend
  (RESEND_API_KEY)経由
- なお ADMIN_EMAILS(複数形)は別の環境変数で、メール送信ではなく
  管理者ログイン権限の判定に使用(src/app/api/auth/me/route.ts)。
  本番では未設定でフォールバック値admin@amista.jpが使われる設計だが、
  実際の管理者アカウントはprofiles.role='admin'側で判定されている
  可能性が高く、要確認事項として残っている

### マッチング機能
- マッチングリクエスト承認/拒否フロー(応答期限7日・自動拒否、拒否理由は通知しない)
- いいねシステム(日次/総数制限、3ヶ月期限)
- /admin/matching一覧テーブルの列ソート機能
- /zoom-checkの「お見合い中の注意事項」同意記録をDBに保存(zoom_check_consentsテーブル、
  管理画面のAdminMatchingClient.tsxで同意状況列を表示)
- マッチング(お見合い)はmatchingsテーブルへの明示的な申請(/api/matching/apply)によってのみ発生する。
  いいねが相互になっただけでは自動的にマッチングは成立しない(2026/7/12確認・是正)。
  かつてsupabase/migrations/012_likes_rules.sqlでDBトリガーとして意図的に廃止された「相互いいね自動マッチング」
  機能が、その後アプリケーション側(src/app/api/likes/route.tsのtryCreateMutualMatch関数)で
  意図せず復活していたことが判明したため、当該関数を削除し本来の仕様(いいねはいいねのみの機能)に是正した。
  相互いいねが成立した場合は「相互いいね」バッジ表示とホーム画面のお知らせバッジのみで、
  そこから会員自身が「お見合いを申請する」ボタンを押すことで初めて/api/matching/applyが呼ばれる。

### ブロック機能
- ブロックはblocksテーブル(blocker_id・blocked_idの片方向レコード)で管理する一方向仕様。
  「ブロックした側の一覧・候補からブロックした相手が見えなくなる」だけの機能であり、
  ブロックされた側には一切通知・可視化されない(ブロックされたことに気づかれない設計、2026/7/12確認)。
- ブロックの効果が及ぶ範囲(いずれも「自分が設定したブロックリスト」のみを参照する一方向フィルター):
  - 会員一覧(/members):自分がブロックした相手を除外(クライアント側フィルター)
  - ホーム画面の新着会員一覧(/dashboard):同上(サーバー側フィルター)
  - AIおすすめの候補者(/api/ai/recommend):自分がブロックした相手を除外(既存実装)
  - いいね受信一覧(/api/likes/received):自分がブロックした相手からのいいねを除外(2026/7/12実装)
- 上記以外(いいね送信・プロフィール個別ページの直接閲覧)はブロックの影響を受けない。
  いいね送信自体をブロック関係で拒否する実装は行っていない(拒否すると相手に気づかれてしまい、
  「気づかれない」設計と矛盾するため、2026/7/12に一度実装した後で撤回した経緯あり)。

### お見合い(Google Meet)機能
- Google Meet API連携(Googleサービスアカウント経由でMeet URL自動発行)
- お見合い中のカウントダウン表示、40分超過時の管理者側確認機能
- Google Meet入室検知による自動キャンセル・強制終了の調査結果反映
- Google Meet準備ガイド(/zoom-guide)、ヘルプ・準備ガイドへのリンクをサイドバー・管理画面に設置
- トップページのナビ「Google Meetとは」クリックで簡易説明モーダル表示(本日実装)

### 決済機能
- Stripe決済(¥980ベース、消費税自動計算)、AIおすすめプラン(月額¥1,078)
- お見合い料決済(create-omiai-session、1回払い)
- サブスクリプション決済(create-checkout-session)
- AIオプション残り日数の常時表示・解約フロー(current_period_endカラム、Webhook連携、本日実装)
- 決済方法拡充(タスク#5):create-checkout-session(サブスクリプション)から
  payment_method_types: ['card']の固定指定を削除し、Apple Pay/Google Payが
  自動表示されるようコード対応完了(本日実装・本番未デプロイ)。
  create-omiai-session(お見合い料)は元々指定なしのため対応不要。
  PayPayは「一般」区分(手数料3.98%)でStripeダッシュボードから申請予定
  (サブスクリプション非対応のためお見合い料のみ)。
  Apple Pay/Google Payの実際の有効化(ドメイン認証含む)、PayPayの申請・審査
  (約2週間)はStripeダッシュボードでの手動対応が必要、未実施。
- Stripeダッシュボード(本番)の「決済手段のドメイン」にamista.netを登録済み、
  ステータス「有効」を確認(2026-07-09)。追加の認証ファイル設置は不要だった。
- 本番へのコミット・デプロイは保留中。PayPayのStripe申請完了・審査通過など、
  他の決済関連対応がまとまった段階でまとめて実施する方針(2026-07-09時点)。

### 管理者機能
- 管理画面「会員管理」のSupabase接続化
- 管理者権限判定(requireAdmin()、authクッキーのhttpOnly化)
- メンテナンス予告・実施中表示の日時設定機能
- 管理者サイドバーの「トップページへ」→「ログアウト」への変更(本日実装)

### 自動化・通知
- pg_cronジョブ×6(リマインダー・期限切れ処理、お見合い料未払い自動キャンセル含む)
- アンケート・成功カップル記録
- AIおすすめオプション契約者の1.5ヶ月(45日)未ログイン通知(タスク#72、2026/7/13実装):
  - 対象:is_premium=trueかつstatus≠withdrawnの会員のうち、Supabase Authのlast_sign_in_atが45日以上前の会員
  - 送信回数は最大3回まで(profiles.ai_inactivity_notice_count、0→1→2→3で打ち止め)。前回送信から45日以上経過していることを条件に次回を送信(実質45日・90日・135日のタイミング)
  - 直近45日以内にログインがあり、かつ過去に送信履歴が残っている会員は、次の非アクティブ期間に備えてカウント・送信日時をリセット
  - 自動解約は実装しない(方針確定・2026/7/13)。理由:マッチングアプリ・婚活サイト・一般的なサブスク管理サービスを調査した結果、「特定の有料オプションのみを、未使用を理由に運営側が自動解約する」という業界慣行が見当たらなかったため。Netflix等の「長期(1〜2年)非アクティブアカウントの自動停止」はアカウント全体かつ長期間が前提の仕組みであり、amistaの1.5ヶ月スケールでの単一オプション解約には当てはまらないと判断
  - 実装:新しいReminderType('ai_option_inactivity_notice')をsrc/app/api/cron/reminder/route.tsに追加(dormant_notice_batchと同じパターンで実装)。メール本文はsrc/app/api/admin/notify/route.ts。DB列はprofiles.ai_inactivity_notice_sent_at(migration 051)・ai_inactivity_notice_count(migration 053)。pg_cronジョブ(migration 052、jobname: ai-option-inactivity-notice、毎日4時UTC)は本番Supabaseにのみ登録(ローカルDockerにはpg_cron・pg_net・vault拡張が存在しないため適用不可、041・043と同様の制約)

### セキュリティ
- セキュリティヘッダー設定
- 管理者権限判定のクッキーhttpOnly化

### 登録STEP1のメールアドレス重複チェック(タスク#17)
- public.email_exists(check_email text) 関数を新規作成(マイグレーション
  038_email_exists_function.sql)。auth.usersにメールが存在するかどうかの
  真偽値のみを返すSECURITY DEFINER関数(パスワード等は返さない)
- 新規API: POST /api/auth/check-email(src/app/api/auth/check-email/route.ts)
  email_exists関数をRPC呼び出し
- register/page.tsx のStep1「次へ」処理(handleNext)で、形式チェック通過後に
  このAPIを呼び出し、既存メールなら「このメールアドレスはすでに登録されています」
  とStep1内にエラー表示してStep2へ進ませないよう対応
- 確認処理自体が失敗した場合は重複チェックをスキップして進める設計
  (最終的にはStep3のsignUp()側でも重複検出されるため)
- 動作確認済み(本日)。本番デプロイ完了(コミット74e3ab5、2026-07-09)

## 2026-07-09 本番デプロイ記録

- コミット74e3ab5(決済方法拡充・Google Meet説明モーダル・管理者ログアウト・
  メール重複チェック)を本番VPS(162.43.75.222)にデプロイ完了
- email_exists RPCを本番相当のSupabaseに対して実行し、
  status=200・data=false(正常動作)を確認
- タスク#5(Stripe決済方法拡充のコード対応・ドメイン登録)、
  タスク#17(メール重複チェック)ともに本番反映・動作確認まで完了
- 残作業:PayPayの「一般」区分でのStripe申請(未実施、審査約2週間)

## 将来的な検討事項(未対応・優先度低・随時見直し)

- AIおすすめ機能(/api/ai/recommend)の1日3回制限は暫定実装。会員数・利用状況を
  見ながら回数変更・キャッシュ導入・AIプラン会員限定化などの追加検討が必要。
  (2026-07-09時点:3回制限のままで問題なしと確認済み)
- BLOCKS_SUPABASE_URL・BLOCKS_SERVICE_ROLE_KEY(docker-compose.yml残存、
  タスク#40完了により実質不使用)の削除要否を検討。
- docker-compose.ymlから不要な旧konkatsu_*サービス定義
  (db/auth/rest/proxy/db_migrate)を削除する別タスクを検討。
- profilesテーブルの本番実スキーマとマイグレーション履歴の不一致整備
  (複数カラムがALTER TABLE直接追加の可能性)。
- 本番VPS上の未追跡バックアップファイル(~/backups/old_files_20260705/内)の
  最終的な削除。
- ローカルsrc/app/直下のpage.tsx.bak・page.tsx.bak2・page.tsx.bak3
  (未対応)の整理。
- ADMIN_EMAILS(複数形、管理者ログイン判定用)が本番で未設定、
  フォールバック値admin@amista.jpが実在しないダミーアドレスである点
  (2026-07-09発見、要確認)。

## ホーム画面・マイページのタブ構成変更(2026/7/9)

### 変更前
- マイページ: マイプロフィール / いいね送信 / いいね受信 / ブロック / 設定 の5タブ
- ホーム画面: ウェルカムバナー → 統計カード(マッチング数・いいね数、常に0固定・未接続) → 新着会員一覧(固定表示)

### 変更後
- マイページ: マイプロフィール / ブロック / アカウント設定(「設定」から改名)の3タブ
- ホーム画面: ウェルカムバナー → タブ切り替え(新着会員 / いいね送信 / いいね受信、初期表示は新着会員) → 統計カードは削除
- 「いいね送信」「いいね受信」はマイページからホームへ移動(中身のロジックは変更なし)
- 実装:共通コンポーネントを src/app/(main)/_components/LikesTabs.tsx に切り出し、ホーム用タブ管理を src/app/(main)/_components/DashboardTabs.tsx に新設
- 既知の制約:タブの選択状態はURLに保存されないため、ページ離脱後に再訪すると常に「新着会員」タブに戻る

### 新着会員一覧の仕様(確認事項)
- 最大6件表示(.limit(6)、created_at降順)
- 異性の会員のみ、ステータスがactiveまたはapprovedのみ、自分がブロックした相手は除外
- 実データに接続済みで正常動作(統計カードと異なり未接続ではない)

## Google Meet実入室検知の実装、および待機室の重大バグ修正(2026/7/9)

### 発見された重大な不具合(修正済み)
- お見合いのGoogle Meetリンクを作成する際、カレンダーイベントにattendees(出席者)を一切設定していなかったため、Google Workspace(youmade.co.jp)の「Meetの安全性の設定」のアクセスタイプが既定で「信頼済み」(組織内は即時参加、組織外の未招待ユーザーは参加リクエストが必要)になっていた
- そのため、実際にマッチングした会員2名(どちらも組織外ユーザー)がリンクをクリックしても、両者とも待機室で止まり、承認できる人が誰もいないため入室できない状態だった可能性が高い(お見合いが実質的に開始できない重大なバグ)
- 修正: Google Workspace管理コンソール → アプリ → Google Workspace → Google Meet → Meetの安全性の設定 → アクセスタイプ を「信頼済み」から「制限なし」(参加できるユーザーはリクエスト不要、誰でもダイヤルイン可)に変更。組織全体の設定変更のため、コード修正は不要
- 修正後、実際に外部アカウントでテスト会議に接続し、待機室なしで即座に入室できることを確認済み

### Google Meet実入室検知機能の追加
- 目的:従来は「同意チェックリストのボタンをクリックした時刻」(user1_joined_at/user2_joined_at)のみで入室を判定しており、実際にGoogle Meetに入室したかどうかは検知していなかった
- 実装:Google Meet REST API v2(conferenceRecords.participants)を使い、実際の入室人数・入退室時刻を取得する checkRealMeetingAttendance(zoomUrl, scheduledAt) を src/lib/google-meet.ts に追加
- ドメイン全体の委任(サービスアカウント amista-calendar@amista-meet.iam.gserviceaccount.com、OAuth 2クライアントID 114321664348653620009)に、スコープ https://www.googleapis.com/auth/calendar, https://www.googleapis.com/auth/meetings.space.readonly, https://www.googleapis.com/auth/meetings.space.settings の3つを設定済み(Google Workspace管理コンソールで設定)
- GCPプロジェクトは amista-meet(プロジェクト番号492254692040)。Google Meet REST APIをこのプロジェクトで有効化済み(過去に別プロジェクトamista(amista-499802)を誤って操作していたことが判明し、途中で訂正した経緯あり)
- src/app/api/cron/meeting-timeout/route.ts のmeeting_timeout_cancel処理に、強制キャンセル直前のチェックとしてcheckRealMeetingAttendance()を組み込み。実際の参加人数が2名以上確認できた場合は、ボタンクリック記録が欠けていても強制キャンセルをスキップする
- 実地テストで、実際に外部アカウントで入室した記録(earliestStartTime/latestEndTime)を正しく取得できることを確認済み(participantCount: 2)
- なお、会議室の設定を書き込みで変更する setSpaceAccessOpen()(accessTypeをOPENにする関数)も実装したが、Calendar API経由で自動生成されたMeet Spaceに対しては「Permission denied on resource Space」という権限エラーが発生し機能しなかった。待機室問題は上記の組織全体設定変更で解決したため、この関数の呼び出しはcreateGoogleMeetUrl()から削除した(関数定義自体は将来のために残置)

## 本番デプロイ完了(2026/7/9)
- コミット 31f8894 を本番VPS(162.43.75.222)へデプロイ完了
- 内容:ホーム/マイページのタブ再編成、Google Meet実入室検知機能、待機室バグの調査記録
- docker compose logs で amista_app が正常起動(Next.js 14.2.29 Ready)していることを確認済み
- 本番は現在503メンテナンス中のため、ブラウザでの実地確認は公開開始後に別途実施予定

## PayPay Stripe申請の保留(2026/7/9)
- Stripeダッシュボードの決済手段設定で、PayPayは「プレビューで利用可能」の状態(以前想定していた外部審査待ちより前の段階)
- 「PayPayを有効にする」フォームで、取扱商材は「一般」(3.98%、Stripeサポート確認済み)を選択する方針
- フォームには「特定商取引法に基づく表記ページのURL」と「決済画面へのアクセス可否」の確認項目があり、本番サイトが503メンテナンス中はアクセス不可のため審査で不利になる可能性がある
- 判断:503解除(タスク#21)後に申請を再開する。今回は申請フォームを送信せずキャンセルした
- 次回申請時に必要な準備:特定商取引法に基づく表記ページのURLを確認・用意しておくこと

## 管理画面ダッシュボード・設定画面の未接続問題(2026/7/9発見)

### ダッシュボード(/admin、src/app/admin/page.tsx)が完全にモックデータ
以下8項目すべてがSupabaseと接続されておらず、ハードコードされたダミーデータ(コード内コメントで「統計データ(ダミー)」「TODO: Supabase連携後にDBから取得するよう変更する」と明記):
- 総会員数(128名、男性62/女性66)... page.tsx:15-23
- 今月の新規登録(23名、前月比+3名)... page.tsx:24-32
- お見合い申請数(47件)... page.tsx:33-41
- 今月の売上(¥141,000)... page.tsx:42-50
- 直近7日間の申請数グラフ... page.tsx:54-62(日付も2026/5/21〜27で固定、現在日時と無関係)
- ステータス別申請数(18/15/14)... page.tsx:64-68
- 最新申請(直近5件、APP-293形式ID)... src/app/admin/_data.ts:220〜(ADMIN_APPLICATIONS配列)
- 最新登録会員(直近5名)... src/app/admin/_data.ts:79〜(ADMIN_MEMBERS配列)

発見の経緯:ダッシュボードの「お見合い申請数47件」が、実際の申請管理画面(/admin/matching、全11件)と食い違っていたことから発覚。

### 設定画面(/admin/settings)の「死んだ設定」項目
保存(DBへのupsert)はされるが、他のどの画面・処理からも参照されていない項目:
- site_name(サイト名)
- 料金設定:light_plan_price、matching_fee_normal、matching_fee_premium(実際の価格はStripeのPrice ID/環境変数側で別管理)
- registration_open(新規登録受付ON/OFF。説明文は「無効にすると新規会員登録を停止します」とあるが、signup/registerフローはこの値を一切参照していない)
- 通知設定:admin_notify_email、notify_new_member、notify_matching_apply(実際のメール送信はprocess.env.ADMIN_EMAILという別の仕組みを使用しており、この設定値は一切反映されない。運用担当者が誤解しやすい要注意箇所)
- マッチング設定:zoom_expiry_days(実際はgoogle-meet.tsのMEETING_DURATION_MS固定40分)、matching_auto_cancel_days(実際は022_auto_reject_cron.sqlに7日固定でハードコード)、dating_wish_expiry_days

正しく機能している設定項目(参考):maintenance_mode、maintenance_notice_enabled、maintenance_scheduled_start/end、ai_option_enabled、omiai_open、review_mode、daily_like_limit、campaign_banner_enabled

### UIバグ
基本設定の「運営者名」「連絡先メールアドレス」入力欄は、保存ボタン押下時の送信データ(handleSaveBasicのペイロード)に含まれておらず、入力・保存しても何も保存されない(表示上は保存できたように見えてしまう)。

## profiles.statusの二重体系の不整合(2026/7/9発見・応急対応済み)

### 発見の経緯
管理画面ダッシュボードの「最新登録会員」欄で、1名だけステータスバッジが日本語ラベルではなく英語のまま「verified」と表示されていたことから発覚。

### 原因
- /admin/verify(本人確認書類の手動チェック画面)は、profiles.statusに 'pending'|'approved'|'rejected'|'verified' の4値体系を書き込む(src/app/api/admin/verify/[id]/route.ts)
- /admin/members・006_withdrawal.sqlのCHECK制約は 'pending'|'approved'|'rejected'|'withdrawn' の4値体系を前提としている
- 本番のCHECK制約はマイグレーション履歴と異なり'verified'を許容する状態になっている(本番実スキーマとマイグレーション履歴の不一致の具体例)

### 実害の確認結果
- /api/members・/api/members/[id]は status IN ('active', 'approved') でのみ会員を表示する実装だが、'active'という値はprofiles.statusに一度も存在しない無効値のため、実質 status='approved' の会員しか表示されない
- status='verified' だった会員1名は、会員一覧・お相手探し画面に一切表示されず、matchingsテーブルにも申請履歴が皆無(見えない会員状態)だったことを確認
- マッチング申請API自体(matching/apply、likes)にはprofiles.statusのチェックはなく、/membersの表示条件を経由できないことが実質的なブロック要因だった

### 応急対応(2026/7/9実施)
- 該当1名(id: 6b87a6cc-35c9-4ff5-b7c8-a232d978fdfe)のstatusを'verified'から'approved'へ直接UPDATE(対象IDを1件のみに限定して実施、前後の状態を確認済み)
- 実施後の件数:pending 2件、approved 8件、rejected 0件、withdrawn 0件、verified 0件(total 10件)

### 恒久対応(未着手、次回以降)
- /admin/verifyの'verified'書き込みを廃止し'approved'に統一するか、'verified'を正式な状態として/api/members等の許可リストに追加するか方針を決定する必要がある
- /api/members・/api/members/[id]のstatus IN ('active', 'approved')条件から、存在しない'active'を除去する(src/app/(main)/dashboard/page.tsxの新着会員クエリにも同種の問題が既にあることを2026/7/9に別途確認済み)
- 本番のCHECK制約とマイグレーション履歴を突き合わせ、正式なマイグレーションファイルとして追いつかせる
