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
  const cookieStore = await cookies();
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
      <LoginForm />
      <ScrollToTop />
    </div>
  );
}
