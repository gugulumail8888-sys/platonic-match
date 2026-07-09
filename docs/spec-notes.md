## プロジェクト全体の既存実装機能(仕様書メモ・遡及記録)

### 会員機能
- 会員登録・ログイン(メール/パスワード、Googleログインボタン実装済み)
- プロフィール編集・本人確認書類の提出/更新(マイページ設定タブ・上書き保存・管理者再審査通知)
- 本人確認書類のAI年齢チェック機能(管理者審査画面・表裏2枚・Claude Haiku 4.5使用、承認時に承認メール送信)
- 登録フローにアバターカラー選択
- 利用規約・プライバシーポリシーへの同意取得
- profiles.id === auth.users.id(意図的設計、profiles.user_idは未使用)

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
