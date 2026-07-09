## プロジェクト全体の既存実装機能(仕様書メモ・遡及記録)

### 会員機能
- 会員登録・ログイン(メール/パスワード、Googleログインボタン実装済み)
- プロフィール編集・本人確認書類の提出/更新(マイページ設定タブ・上書き保存・管理者再審査通知)
- 本人確認書類のAI年齢チェック機能(管理者審査画面・表裏2枚・Claude Haiku 4.5使用、承認時に承認メール送信)
- 登録フローにアバターカラー選択
- 利用規約・プライバシーポリシーへの同意取得
- profiles.id === auth.users.id(意図的設計、profiles.user_idは未使用)

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
- 動作確認済み(本日)。本番未デプロイ
