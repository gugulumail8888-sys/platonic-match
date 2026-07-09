## プロジェクト全体の主要フロー(フロー図メモ・遡及記録)

### 会員登録フロー
サインアップ → メール/パスワードまたはGoogleログイン → 本人確認書類提出
→ 管理者審査(AI年齢チェック補助)→ 承認メール送信 → プロフィール編集 → マッチング開始
(Step1でメールアドレス形式チェック+重複チェックを実施。重複時はStep2へ進めない)

### マッチング・お見合いフロー
いいね送信 → マッチングリクエスト → 相手承認/拒否(7日以内、無応答は自動拒否)
→ お見合い料決済(create-omiai-session)→ 日程調整 → Google Meet URL自動発行
→ zoom-check同意記録 → お見合い実施(40分・カウントダウン表示)
→ 完了後アンケート送信(1時間後)→ 成功カップル記録

### 退会・解約フロー
マイページ「解約する」→ 残り日数付き確認ダイアログ → cancel-subscription API
→ Stripe cancel_at_period_end設定 → customer.subscription.updated Webhook
→ profiles更新 → 退会画面(/withdraw)での残り日数確認
