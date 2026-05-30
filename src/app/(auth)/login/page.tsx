import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

export const metadata: Metadata = {
  title: "ログイン",
};

export default async function LoginPage() {
  const cookieStore = cookies();
  const authCookie = cookieStore.get("auth");

  if (authCookie) {
    try {
      const auth = JSON.parse(authCookie.value);
      if (auth.role === "admin") redirect("/admin");
      if (auth.role === "user") redirect("/members");
    } catch {
      // 不正なCookieは無視
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12 relative">
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-zinc-400 hover:text-teal-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        トップページへ
      </Link>
      <LoginForm />
      <ScrollToTop />
    </div>
  );
}
