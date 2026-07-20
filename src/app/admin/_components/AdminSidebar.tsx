'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, HeartHandshake, Settings, Shield, ShieldCheck, Calendar, LogOut, ClipboardList, ClipboardCheck, Download, Moon, MessageSquare, Video, HelpCircle, Flag, RefreshCw, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin',          label: 'ダッシュボード', icon: Home,          exact: true },
  { href: '/admin/members',  label: '会員管理',       icon: Users,         exact: false },
  { href: '/admin/verify',   label: '本人確認審査',   icon: ShieldCheck,   exact: false },
  { href: '/admin/matching', label: '申請管理',       icon: HeartHandshake, exact: false },
  { href: '/admin/schedule', label: '日程管理',       icon: Calendar,      exact: false },
  { href: '/admin/cancellations', label: 'キャンセル・返金管理', icon: RefreshCw, exact: false },
  { href: '/admin/review',   label: 'プロフィール管理', icon: ClipboardList, exact: false },
  { href: '/admin/dormant',  label: '休眠会員',       icon: Moon,          exact: false },
  { href: '/admin/surveys',  label: 'アンケート',     icon: ClipboardCheck, exact: false },
  { href: '/admin/feedback', label: 'ご意見・ご要望', icon: MessageSquare,  exact: false },
  { href: '/admin/reports',  label: '通報一覧',       icon: Flag,          exact: false },
  { href: '/admin/export',   label: 'データ出力',     icon: Download,      exact: false },
  { href: '/admin/settings', label: '設定',           icon: Settings,      exact: false },
];

const EXTERNAL_LINKS = [
  { href: '/zoom-guide', label: 'Google Meetお見合い準備ガイド', icon: Video },
  { href: '/help',       label: 'ヘルプ',                        icon: HelpCircle },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* ========== デスクトップ サイドバー ========== */}
      <aside className="hidden lg:flex flex-col w-56 bg-zinc-900 border-r border-zinc-800 h-[calc(100vh-var(--banner-offset))] fixed left-0 top-[var(--banner-offset)] z-40 overflow-hidden">
        {/* ロゴ */}
        <div className="p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">amista</p>
              <p className="text-[10px] text-zinc-500 leading-tight">管理者パネル</p>
            </div>
          </div>
        </div>

        {/* ナビ */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                  isActive
                    ? 'bg-teal-950 text-teal-400 font-medium border border-teal-900'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 flex-shrink-0',
                    isActive ? 'text-teal-400' : 'text-zinc-500'
                  )}
                />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />
                )}
              </Link>
            );
          })}

          {/* 外部リンク */}
          <div className="mt-3 pt-3 border-t border-zinc-800 space-y-0.5">
            {EXTERNAL_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <Icon className="w-4 h-4 flex-shrink-0 text-zinc-500" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ログアウト */}
        <div className="p-3 border-t border-zinc-800">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-red-950 hover:text-red-400 transition-all text-sm w-full"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            ログアウト
          </button>
        </div>
      </aside>

      {/* ========== モバイル トップバー ========== */}
      <header className="lg:hidden sticky top-[var(--banner-offset)] z-30 bg-zinc-900 border-b border-zinc-800">
        {/* ブランド + ハンバーガー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-bold text-white">amista 管理者パネル</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex-shrink-0"
            aria-label="メニュー"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {/* モバイルナビ（開閉式） */}
        {mobileMenuOpen && (
          <div className="max-h-[calc(100vh-56px)] overflow-y-auto px-3 py-2 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                    isActive
                      ? 'bg-teal-950 text-teal-400 font-medium border border-teal-900'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-2 pt-2 border-t border-zinc-800 space-y-0.5">
              {EXTERNAL_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-950 transition-all text-sm w-full"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                ログアウト
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
