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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // admin ロールは管理画面へ
  const authCookie = (await cookies()).get("auth")?.value;
  let role: string | undefined;
  let hasAiOption = false;
  let nickname: string | undefined;
  if (authCookie) {
    try {
      const auth = JSON.parse(decodeURIComponent(authCookie)) as { role?: string; hasAiOption?: boolean; nickname?: string };
      role = auth.role;
      hasAiOption = auth.hasAiOption === true;
      nickname = auth.nickname;
      if (auth.role === "admin") {
        redirect("/admin");
      }
    } catch {
      // 不正な cookie は無視
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-[var(--banner-offset)]">
      <Navbar role={role} hasAiOption={hasAiOption} nickname={nickname} />
      {/* デスクトップ：サイドバー分のmargin（role が無い場合は適用しない） */}
      <main className={role ? "lg:ml-64 pb-24 lg:pb-0 min-h-screen" : "min-h-screen"}>
        {children}
      </main>
      <ScrollToTop />
    </div>
  );
}
