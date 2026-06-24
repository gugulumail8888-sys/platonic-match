import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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

  if (!user) {
    redirect("/login");
  }

  // admin ロールは管理画面へ
  const authCookie = cookies().get("auth")?.value;
  if (authCookie) {
    try {
      const auth = JSON.parse(decodeURIComponent(authCookie)) as { role?: string };
      if (auth.role === "admin") {
        redirect("/admin");
      }
    } catch {
      // 不正な cookie は無視
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-10">
      <Navbar />
      {/* デスクトップ：サイドバー分のmargin */}
      <main className="lg:ml-64 pb-24 lg:pb-0 min-h-screen">
        {children}
      </main>
      <ScrollToTop />
    </div>
  );
}
