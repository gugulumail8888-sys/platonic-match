// TODO: 本番環境では管理者認証チェックを追加する
//       例: セッションのroleが'admin'でない場合は/loginにリダイレクト
import { AdminSidebar } from './_components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <AdminSidebar />
      {/* デスクトップ: サイドバー分のmargin */}
      <main className="lg:ml-56 min-h-screen">
        {children}
      </main>
    </div>
  );
}
