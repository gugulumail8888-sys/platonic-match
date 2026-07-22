# amista フロー図(全面棚卸し版・2026/7/22作成・テキストベース)

docs/tasks.mdの全履歴と実際のコード実装を突き合わせて作成した、現時点の主要フローの一覧です。個々の変更の経緯はdocs/tasks.mdの各タスク番号を参照してください。

---

## 1. 会員登録フロー

```
サインアップ画面
  → STEP1:メールアドレス入力(形式チェック+重複チェック、email_exists RPC)
      └ 重複ならSTEP2へ進めずエラー表示
  → STEP2〜:プロフィール項目入力(アバターカラー選択含む)
  → 本人確認書類提出(表・裏2枚、10MB以内・JPEG/PNG/HEIC/WebP/PDFのみ)
  → 管理者審査 または AI自動審査(Claude Haikuによる年齢判定、/api/ai/verify-age)
      ├ 自動承認 → status='approved'
      ├ 管理者が手動承認 → status='verified'(手動チェック済み)
      └ 不備 → 不備メール送信(履歴記録)→ 再提出待ち
  → 承認メール送信
  → プロフィール編集・マッチング開始
```

## 2. ログイン・パスワード再設定フロー

```
ログイン画面
  → メール/パスワード or Googleログイン
  → サーバー側/api/auth/loginがlogin_attemptsテーブルでロック状態を確認
      └ 5回連続失敗 → 5分間ロック(429)
  → 成功 → ホーム画面へ
```

```
パスワードを忘れた場合
  → /forgot-password でメールアドレス入力 → resetPasswordForEmail()
  → メール受信(リンク + 6桁認証コードの両方が記載)
      ├ リンククリック → /api/auth/callback → /reset-password (セッション確立時のみ有効)
      │     └ メールセキュリティスキャナーにより無効化される場合あり
      └ 認証コード入力(推奨) → verifyOtp({type:'recovery'}) → updateUser({password})
  → 完了 → ログイン画面へ
```

## 3. マッチング・お見合いフロー

```
いいね送信(日次/総数制限、3ヶ月期限)
  → (相互いいねのみでは自動マッチングしない)
  → 会員が能動的に「お見合いを申請する」→ /api/matching/apply → matchings行作成(status='pending')
  → 相手が確認・承認 or 拒否(7日以内、無応答は自動拒否)
      └ 拒否時は理由選択(任意、相手には非開示)
  → 承認 → 日程調整(候補提案→選択、schedule_slots)
      └ 延期(前日17時まで・1回限り)も可能
  → 日程確定(status='scheduling')
  → 申請者・お相手それぞれがお見合い料を支払う(create-omiai-session)
      └ 両者の支払いが両方完了して初めて次へ進む
  → Google Meet URL自動発行・確定メール送信・status='zoom_completed'
  → 当日、予定時刻10分前にボタン有効化・10〜15分前にリマインドメール
  → zoom-check同意記録 → Google Meet入室 → お見合い実施(40分)
      └ 15分未入室で自動キャンセル(ただし実際の入室検知でスキップ判定あり)
      └ 40分超過は管理者側で確認可能
  → 完了(meeting_ended_at記録)
  → 1時間後アンケート送信
  → 「交際希望を伝える」ボタン(申請者・お相手それぞれ独立)
  → 双方が交際希望 → 成功カップルとして記録可能(成婚報告 /marriage-report)
```

## 4. キャンセル・返金フロー

```
一方がキャンセル報告(/cancel-report、理由・詳細入力)
  → matchings.status='cancelled'、cancel_reason等を記録
  → 原子的な更新(compare-and-swap)のため同時報告でも両方保持される
  → もう一方が/cancel-reportを開く
      └ 「相手はすでに報告済みです」案内バナー表示、追加報告も可能
  → 管理画面「キャンセル・返金管理」に両者の報告が表示(1件目=赤バッジ、2件目=オレンジバッジ)
  → 管理者が非がない側への返金操作(手動、申請者・お相手を個別に選択)
      → Stripe返金 → refundsテーブル記録 → matchings.refunded/partner_refunded更新
      → 返金先会員へ案内メール自動送信
```

```
自動キャンセル・自動返金(cronジョブ)
  ① お見合い開始15分経過・未入室 → meeting_timeout_cancel
      → 実際の入室検知(Google Meet API)で2名以上確認できればスキップ
      → 強制キャンセル時、遅刻しなかった側へ自動返金(refundOmiaiPayment)
  ② 前日17時までに未入金 → unpaid_cancel
      → 支払い済みの側へ自動返金
```

## 5. 決済・キャンペーンフロー

```
お見合い料決済(都度払い、日程確定後)
  申請者/お相手がボタンを押す → create-omiai-session
    → 本人のプラン(無料/AIおすすめ)に応じた金額(¥3,500/¥3,000)でStripe Checkout
    → Webhook(checkout.session.completed)で該当ロールの列を更新(payment_intent_id等・paid_at)
    → 両者の支払いが完了 → Google Meet URL発行・確定メール送信
```

```
AIおすすめオプション申込み(サブスクリプション)
  /recommend画面(未加入)または/mypage → 「申し込む」ボタン
    → create-checkout-session(月額¥1,078)
    → isCampaignActive()判定(キャンペーン期間内・先着200名未満)
        ├ true → クーポン適用(3ヶ月無料)
        └ false → 通常課金(1ヶ月目から)
    → Webhookでprofiles.is_premium=true・subscription_started_at記録
```

```
解約フロー
  マイページ「解約する」→ 残り日数付き確認ダイアログ
    → cancel-subscription API → Stripe cancel_at_period_end設定
    → customer.subscription.updated Webhook → profiles更新
    → /withdrawで残り日数確認
```

```
管理画面からのAIオプション一時停止(意図しないトラブル対応)
  管理画面「AIおすすめオプション」トグルOFF
    → 確認モーダル(「契約者の請求も一時停止するか」チェックボックス、デフォルトON)
    → ON時:契約者全員のStripeサブスクリプションにpause_collection(behavior:'void')設定
    → サイト全体にAiOptionPausedBanner表示(「無償延長されるので手続き不要」)
  トグルON(再開)
    → 実際に一時停止していた場合のみpause_collection解除
```

## 6. アンケート・メール送信フロー

```
お見合い完了1時間後
  → アンケート送信(お見合い後アンケート、omiai-survey)
  → 管理画面「アンケート」で確認・集計・CSV出力
```

```
成婚報告
  マイページ「アカウント設定」タブ → 「成婚を報告する」ボタン
    → /marriage-report で入力・送信
    → 管理画面「アンケート」の成婚報告タブで確認
  (旧/withdrawal-surveyは/marriage-reportへの自動転送ページ)
```

```
メール送信全般(Resend経由、noreply@amista.net)
  種別:新規申込・お見合い確定・キャンセル・入金リマインド(3日前)・
  未入金自動キャンセル前日通知・日程延期・通報受付(管理者宛)・
  休眠会員通知(12ヶ月未ログイン、30日前)・AIオプション更新リマインド(7日前)・
  AIオプション非アクティブ通知(45日未ログイン、最大3回)・返金完了・
  障害・緊急のお知らせ(バナーON時、任意)・パスワード再設定(認証コード)
```

## 7. 休眠会員・退会・データ削除フロー

```
休眠判定(12ヶ月以上未ログイン)
  → 30日前通知メール(pg_cron、dormant_notice_batch)
  → 管理画面「休眠会員」で手動通知・一覧確認も可能(重複送信防止済み)
```

```
退会フロー
  マイページ「退会する」→ 退会処理 → profiles.status='withdrawn'・withdrawn_at記録
  → 二段階データ削除(/api/cron/data-retention)
      ① 退会後1年:本人確認書類の画像を削除
      ② 退会後3年:matchings→reports→marriage_reports→profiles→auth.usersの順で完全削除
          (正しい順序に2026/7/22修正済み。誤った順序だと外部キー制約違反で削除が失敗する)
```

## 8. 管理画面バナー・通知の重ね合わせ

```
表示優先順位(上から):
  1. 障害・緊急のお知らせ(IncidentBanner、文言自由入力・メール送信選択可)
  2. AIオプション利用不可(AiOptionPausedBanner、意図しない請求停止時)
  3. メンテナンス予告(MaintenanceNoticeBanner)
  4. プレリリース案内(PrereleaseNoticeBanner、omiai_open=falseの間)
  5. ベータ版バナー(BetaBanner)

  → BannerOffsetSync(ResizeObserver)が実際の高さを測定し--banner-offsetへ反映
  → 各レイアウトのpt-[var(--banner-offset)]で重なりを防止
```

## 9. フィードバックウィジェット表示切替

```
全ページ共通コンポーネント(src/app/layout.tsxに配置)
  usePathname()で現在パスを判定
    ├ /admin配下 → コンパクト表示(アイコンのみ)
    ├ 会員向け主要パス((main)ルートグループ) → コンパクト表示(アイコンのみ)
    └ それ以外(公開ページ:トップ・LP・ログイン等) → 横長表示(テキスト付き)
```

---

## 参考:cronジョブ一覧(本番Supabase pg_cron)

- お見合い料未払い自動キャンセル
- 日程確定後の当日リマインド(5分ごと実行、10〜15分前ウィンドウ)
- 15分未入室の自動強制キャンセル(実入室検知つき)
- 40分超過チェック
- 休眠会員30日前通知バッチ
- AIオプション更新7日前リマインド
- AIオプション45日未ログイン通知
- 本人確認書類1年後削除・退会アカウント3年後削除(data-retention)
- (計9ジョブ、詳細はdocs/tasks.md #49参照)
