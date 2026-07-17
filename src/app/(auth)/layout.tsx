// (auth)グループ(ログイン・会員登録・パスワード関連の5画面)共通レイアウト。
// これまで共通レイアウトが存在せず、固定表示されるバナー(ベータ版・メンテナンス予告・
// AIオプション停止等)の高さ分の余白がなかったため、画面上部の要素がバナーと重なる
// 不具合があった(2026/7/15発見)。(main)グループ・(public-nav)グループと同じ
// pt-[var(--banner-offset)]パターンで解消する。
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pt-[var(--banner-offset)]">
      {children}
    </div>
  );
}
