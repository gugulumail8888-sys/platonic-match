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

## ホーム画面表示フロー(2026/7/9更新)
1. ログイン後ホーム画面へ遷移
2. サーバー側でSupabaseから新着会員データ(異性・active/approved・ブロック除外・created_at降順・最大6件)を取得
3. クライアント側タブコンポーネント(DashboardTabs)が新着会員データをpropsで受け取り、初期表示は「新着会員」タブ
4. 「いいね送信」「いいね受信」タブ選択時、それぞれ /api/likes、/api/likes/received をクライアント側でfetchして表示
5. マイページ側は「マイプロフィール」「ブロック」「アカウント設定」の3タブのみ(いいね関連はホームへ移動済み)

## Google Meet入室確認フロー(2026/7/9更新)
1. お見合い成立後、createGoogleMeetUrl()でカレンダーイベント+Meetリンクを作成(組織のMeet安全性設定によりアクセスタイプは「制限なし」、待機室なしで誰でも入室可能)
2. 会員がzoom-checkページで同意チェックリストに同意しGoogle Meetへ参加ボタンを押すと、user1_joined_at/user2_joined_at(ボタンクリック時刻)を記録(同意の証跡として維持)
3. 5分おきのpg_cronジョブ(meeting-timeout-cancel)が、scheduled_atから15分経過かつステータスzoom_completed・meeting_ended_at未設定のお見合いを抽出
4. 抽出された候補のうち、ボタンクリック記録が欠けているものについて、checkRealMeetingAttendance()でGoogle Meet REST APIから実際の入室人数を取得
5. 実際の入室が2名以上確認できればキャンセルをスキップ(実際は入室していたと判断)、確認できなければ従来通り強制キャンセルしてnotifyCancelTimeout()を実行

## AIおすすめオプション1.5ヶ月未ログイン通知フロー(2026/7/13追加・タスク#72)
1. pg_cronジョブ(ai-option-inactivity-notice、毎日4時UTC)が/api/cron/reminder(type: ai_option_inactivity_notice)を呼び出す
2. Supabase Authの全ユーザーからlast_sign_in_atが45日以上前の会員を抽出する一方、直近45日以内にログインがある会員は「非アクティブ」から除外
3. 非アクティブ会員のうち、is_premium=true・status≠withdrawn・ai_inactivity_notice_count(送信回数)が3未満の会員を対象に絞り込む
4. 対象者ごとに、前回送信(ai_inactivity_notice_sent_at)から45日以上経過していれば通知メールを送信し、送信回数をインクリメント・送信日時を更新(1回目は無条件、2・3回目は間隔をあけて送信、3回で打ち止め・それ以降は自動解約せず送信も終了)
5. 直近45日以内にログインがあり、かつ過去に送信履歴が残っている会員は、次の非アクティブ期間に備えて送信回数・送信日時をリセット
