# タスク#1 全ページ動作テスト記録

開始日: 2026/7/22
対象: src/app配下のpage.tsx 55ファイル(動的ルート[id]は複数実データで確認)
進め方: 動線グループごとに実施。結果はOK/NG、気づいた点を都度追記。

## 1. 公開ページ(未ログイン)

- [x] src/app/page.tsx (トップページ) - OK
- [x] src/app/lp/page.tsx (LP) - OK
- [x] src/app/how-it-works/page.tsx - OK
- [x] src/app/(public)/terms/page.tsx (利用規約) - OK
- [x] src/app/(public)/privacy/page.tsx (プライバシーポリシー) - OK
- [x] src/app/(public)/tokusho/page.tsx (特定商取引法に基づく表記) - OK
- [x] src/app/(public)/cancel-policy/page.tsx (キャンセルポリシー) - OK
- [x] src/app/(public)/contact/page.tsx (お問い合わせ) - OK
- [x] src/app/(public)/help/page.tsx (ヘルプ) - OK
- [x] src/app/(public-nav)/zoom-guide/page.tsx (Google Meetお見合い準備ガイド) - OK
- [x] src/app/(auth)/login/page.tsx (ログイン) - OK
- [x] src/app/(auth)/register/page.tsx (新規登録) - OK(ステップ1/4表示まで確認)
- [x] src/app/(auth)/signup/page.tsx (サインアップ) - OK
- [x] src/app/(auth)/forgot-password/page.tsx (パスワードを忘れた方) - OK
- [x] src/app/(auth)/reset-password/page.tsx (パスワード再設定) - OK(トークンなしアクセス時の「リンク無効」エラー表示を確認、想定通りの挙動)
- [x] src/app/maintenance/page.tsx (メンテナンス画面) - OK

## 2. 一般会員の主要動線

- [x] src/app/(main)/dashboard/page.tsx (ホーム) - OK
- [x] src/app/(main)/members/page.tsx (会員一覧) - OK
- [x] src/app/(main)/members/[id]/page.tsx (会員詳細) - OK(前回セッションで確認済み)
- [x] src/app/(main)/matching/page.tsx (マッチング) - OK(実データ14件、各ステータス表示も正常)
- [x] src/app/(main)/matching/complete/page.tsx - OK(パラメータなし時のプレースホルダー表示、クラッシュなし)
- [x] src/app/(main)/messages/page.tsx - OK(常に/dashboardへリダイレクトする意図的な仕様、未実装機能のプレースホルダー)
- [x] src/app/(main)/recommend/page.tsx (AIおすすめ) - OK(#102でcookies()修正した箇所、正常動作)
- [x] src/app/(main)/schedule/select/page.tsx (日程選択) - OK
- [x] src/app/(main)/schedule/request/page.tsx (日程調整依頼) - OK
- [x] src/app/(main)/schedule/complete/page.tsx - OK
- [x] src/app/(main)/zoom-check/page.tsx (Google Meet直前チェック) - OK(前回セッションで確認済み、'use client'修正箇所)
- [x] src/app/(main)/omiai-survey/page.tsx (お見合い後アンケート) - OK
- [x] src/app/(main)/mypage/page.tsx (マイページ) - OK
- [x] src/app/(main)/profile/page.tsx (プロフィール) - OK(マイページと同内容表示のため実質確認済み)
- [x] src/app/(main)/profile/edit/page.tsx (プロフィール編集) - OK
- [x] src/app/(main)/report/page.tsx (通報) - OK
- [x] src/app/(main)/cancel-report/page.tsx (キャンセル報告) - OK(パラメータなし時の「申請情報が見つかりません」表示、想定通り)
- [x] src/app/(main)/marriage-report/page.tsx (成婚報告) - OK
- [x] src/app/(main)/withdraw/page.tsx (退会) - OK(お見合い申請中は退会不可の業務ルール表示を確認)
- [x] src/app/(main)/withdrawal-survey/page.tsx (退会アンケート) - OK(#125対応により/marriage-reportへ常時リダイレクトする意図的な仕様)

## 3. 決済関連

- [x] src/app/payment/omiai/page.tsx (お見合い料決済) - OK(matchingIdパラメータなし時は/matchingへリダイレクトする意図的な仕様、ソースで確認)
- [x] src/app/payment/omiai/success/page.tsx - OK
- [x] src/app/payment/success/page.tsx (AIおすすめオプション決済成功) - OK
- [x] src/app/payment/cancel/page.tsx (決済キャンセル) - OK

## 4. 管理者側

- [x] src/app/admin/page.tsx (ダッシュボード) - OK
- [x] src/app/admin/members/page.tsx (会員管理・一覧) - OK(前回セッションで確認済み)
- [x] src/app/admin/members/[id]/page.tsx (会員管理・詳細) - OK(前回セッションで確認済み)
- [x] src/app/admin/verify/page.tsx (本人確認審査・一覧) - OK(前回セッションで確認済み)
- [x] src/app/admin/verify/[id]/page.tsx (本人確認審査・詳細) - OK(前回セッションで確認済み)
- [x] src/app/admin/matching/page.tsx (申請管理) - OK(実データ15件、各ステータス表示も正常)
- [x] src/app/admin/schedule/page.tsx (日程管理) - OK
- [x] src/app/admin/cancellations/page.tsx (キャンセル・返金管理) - OK
- [x] src/app/admin/dormant/page.tsx (休眠会員) - OK
- [x] src/app/admin/review/page.tsx (プロフィール管理・一覧) - OK
- [x] src/app/admin/review/[id]/page.tsx (プロフィール管理・詳細) - OK(前回セッションで確認済み)
- [x] src/app/admin/surveys/page.tsx (アンケート) - OK
- [x] src/app/admin/feedback/page.tsx (ご意見・ご要望) - OK
- [x] src/app/admin/reports/page.tsx (通報一覧) - OK
- [x] src/app/admin/export/page.tsx (データ出力) - OK
- [x] src/app/admin/settings/page.tsx (設定) - OK

## 5. 異常系

- [x] メンテナンスモードON時の表示・アクセス制御 - OK(実際にON→トップページ・未ログイン時ともにメンテナンス画面表示を確認、管理者は/admin・/loginにアクセス可能なことも確認、確認後OFFに戻し通常表示に復帰することも確認)
- [x] 利用停止会員のログイン拒否・強制ログアウト(#121) - OK(#121実装時・#102重点テスト時に確認済みのため今回は割愛)
- [x] 未ログイン時に会員限定ページへアクセス→ログインへリダイレクト - OK(/dashboard, /adminともに確認)
- [x] 管理者が一般会員ページへアクセス→/adminへ誘導 - OK(#102重点テストで確認済み)
- [x] 一般会員が管理者ページへアクセス→/dashboardへ誘導 - OK

---

## テスト記録

- 2026/7/22: グループ1「公開ページ(未ログイン)」16ページすべてOK。
  - 気づいた点①: 開発サーバー(Turbopack)で各ページ初回アクセス時のコンパイルに30〜45秒程度かかる場合がある。docker logsで確認したところエラーではなく初回コンパイルの正常な待ち時間(Next.js 16のTurbopack dev特性)。本番ビルドでは事前ビルド済みのため発生しない。
  - 気づいた点②: docker logsにNext.js 16の新しい警告「html要素にscroll-behavior: smoothを指定する場合はdata-scroll-behavior="smooth"属性も必要」が出ていたため、src/app/layout.tsxの&lt;html&gt;タグに`data-scroll-behavior="smooth"`を追加して解消(コミット未実施、後でまとめてコミット予定)。
- 2026/7/22: グループ2「一般会員の主要動線」20ページすべてOK。test@amista.jpでログインして確認。matching画面は実データ(申請14件)でも正常表示、AIおすすめ画面(#102でcookies()修正箇所)・zoom-check画面(#102で'use client'修正箇所)・会員詳細ページ(#102でparams修正箇所)も正常動作を確認。messagesページと退会アンケートページは意図的なリダイレクト仕様(既存タスクによる既知の設計)であることをソースコードで確認、バグではない。
- 2026/7/22: グループ3「決済関連」4ページすべてOK。payment/omiaiはmatchingIdパラメータ必須のためパラメータなしアクセス時は/matchingへリダイレクトする仕様(ソースで確認、バグではない)。決済成功・キャンセル画面は静的表示で正常。
- 2026/7/22: グループ4「管理者側」16ページすべてOK。管理者アカウント(Supervisor1@amista.invalid)でログインして確認。申請管理は実データ15件、日程管理・キャンセル返金管理・アンケート・ご意見要望・通報一覧もすべて実データで正常表示を確認。
- 2026/7/22: グループ5「異常系」5項目すべてOK。メンテナンスモードは管理画面から実際にON/OFF切り替えて実地確認(ON時は未ログインアクセスがすべてメンテナンス画面へ、管理者は/admin・/loginにアクセス可能。確認後OFFに戻し通常表示への復帰も確認)。ロールベースルーティング(管理者⇄一般会員の相互誘導)・未ログイン時のリダイレクトも正常。

【タスク#1 全体総括】全55ページ・5グループすべて確認完了。深刻な不具合は0件。副産物として#102(Next.js 16アップグレード)関連の軽微な警告1件(data-scroll-behavior属性)を発見・修正済み(未コミット)。messages/withdrawal-surveyページのリダイレクトは既存タスク(#125等)による意図的な仕様と確認。
