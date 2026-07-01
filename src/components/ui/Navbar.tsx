"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Heart,
  User,
  LogOut,
  Home,
  Handshake,
  Users,
  Bot,
  HelpCircle,
  Mail,
  Lock,
  Video,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "ホーム", icon: Home, requireAiOption: false },
  { href: "/members", label: "会員一覧", icon: Users, requireAiOption: false },
  { href: "/matching", label: "マッチング", icon: Handshake, requireAiOption: false },
  { href: "/recommend", label: "AIおすすめ", icon: Bot, requireAiOption: true },
  { href: "/mypage", label: "マイページ", icon: User, requireAiOption: false },
];

const supportNavItems = [
  { href: "/zoom-guide", label: "Google Meetお見合い準備ガイド", icon: Video },
  { href: "/help", label: "ヘルプ", icon: HelpCircle },
  { href: "/contact", label: "お問い合わせ", icon: Mail },
];

// Cookieからauth情報を取得
function getAuthFromCookie(): { role: string; email: string; hasAiOption?: boolean } | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)auth=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [auth, setAuth] = useState<{ role: string; email: string; hasAiOption?: boolean } | null>(null);

  useEffect(() => {
    setAuth(getAuthFromCookie());
  }, []);

  const hasAiOption = auth?.hasAiOption === true;

  const handleSignOut = async () => {
    document.cookie = "auth=; path=/; max-age=0";
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const renderNavItem = (item: typeof navItems[0], mobileMode = false) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    const isLocked = item.requireAiOption && !hasAiOption;

    if (mobileMode) {
      return (
        <div key={item.href} className="relative flex-1">
          {isLocked ? (
            <div className="flex flex-col items-center gap-0.5 px-1 py-1.5 text-zinc-700 cursor-not-allowed relative">
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-tight">{item.label}</span>
              <Lock className="w-2 h-2 absolute top-0.5 right-0.5 text-zinc-600" />
            </div>
          ) : (
            <Link
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1 py-1.5 transition-all duration-200",
                isActive ? "text-primary-400" : "text-zinc-500"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-tight">{item.label}</span>
            </Link>
          )}
        </div>
      );
    }

    return (
      <div key={item.href}>
        {isLocked ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-700 cursor-not-allowed select-none">
            <Icon className="w-5 h-5 text-zinc-700" />
            <span className="text-sm">{item.label}</span>
            <div className="ml-auto flex items-center gap-1">
              <Lock className="w-3 h-3 text-zinc-600" />
              <span className="text-[10px] text-zinc-600">オプション</span>
            </div>
          </div>
        ) : (
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive
                ? "bg-primary-950 text-primary-400 font-medium border border-primary-900"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            )}
          >
            <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary-400" : "text-zinc-500 group-hover:text-zinc-300")} />
            <span className="text-sm">{item.label}</span>
            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />}
          </Link>
        )}
      </div>
    );
  };

  return (
    <>
      {/* デスクトップ サイドバー */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 h-[calc(100vh-2.5rem)] fixed left-0 top-10 z-40">
        <div className="p-6 border-b border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">
              ami<span className="text-primary-400">sta</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => renderNavItem(item))}

          <div className="pt-2 mt-2 border-t border-zinc-800">
            {supportNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-primary-950 text-primary-400 font-medium border border-primary-900"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                  <span className="text-sm">{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-red-950 hover:text-red-400 transition-all w-full text-sm"
          >
            <LogOut className="w-5 h-5" />
            ログアウト
          </button>
        </div>
      </aside>

      {/* モバイル ボトムナビ */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50"
        style={{ transform: 'translateZ(0)' }}
      >
        <div className="flex items-center py-2 px-1" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
          {navItems.map((item) => renderNavItem(item, true))}
        </div>
      </nav>
    </>
  );
}
