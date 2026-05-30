import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/ui/Navbar";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未認証ユーザーはログインへ（Supabase連携完了後に有効化）
  // TODO: Supabase連携後にコメントアウトを外す
  // if (!user) {
  //   redirect("/login");
  // }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      {/* デスクトップ：サイドバー分のmargin */}
      <main className="lg:ml-64 pb-24 lg:pb-0 min-h-screen">
        {children}
      </main>
      <ScrollToTop />
    </div>
  );
}
