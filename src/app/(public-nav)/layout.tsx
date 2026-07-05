import { cookies } from "next/headers";
import { Navbar } from "@/components/ui/Navbar";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

export default function PublicNavLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authCookie = cookies().get("auth")?.value;
  let role: string | undefined;
  let hasAiOption = false;
  if (authCookie) {
    try {
      const auth = JSON.parse(decodeURIComponent(authCookie)) as { role?: string; hasAiOption?: boolean };
      role = auth.role;
      hasAiOption = auth.hasAiOption === true;
    } catch {
      // 不正な cookie は無視
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-[var(--banner-offset)]">
      <Navbar role={role} hasAiOption={hasAiOption} />
      <main className={role ? "lg:ml-64 pb-24 lg:pb-0 min-h-screen" : "min-h-screen"}>
        {children}
      </main>
      <ScrollToTop />
    </div>
  );
}
