'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, HeartHandshake, Settings, Shield, ShieldCheck, Calendar, ArrowLeft, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin',          label: 'ダッシュボード', icon: Home,          exact: true },
  { href: '/admin/review',   label: '個別審査',       icon: ClipboardList, exact: false },
  { href: '/admin/members',  label: '会員管理',       icon: Users,         exact: false },
  { href: '/admin/matching', label: '申請管理',       icon: HeartHandshake, exact: false },
  { href: '/admin/verify',   label: '本人確認審査',   icon: ShieldCheck,   exact: false },
  { href: '/admin/schedule', label: '日程管理',       icon: Calendar,      exact: false },
  { href: '/admin/settings', label: '設定',           icon: Settings,      exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ========== デスクトップ サイドバー ========== */}
      <aside className="hidden lg:flex flex-col w-56 bg-zinc-900 border-r border-zinc-800 min-h-screen fixed left-0 top-0 z-40">
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
        <nav className="flex-1 p-3 space-y-0.5">
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
        </nav>

        {/* トップページへ */}
        <div className="p-3 border-t border-zinc-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            トップページへ
          </Link>
        </div>
      </aside>

      {/* ========== モバイル トップバー ========== */}
      <header className="lg:hidden sticky top-0 z-30 bg-zinc-900 border-b border-zinc-800">
        {/* ブランド */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
          <Shield className="w-4 h-4 text-teal-400" />
          <span className="text-sm font-bold text-white">amista 管理者パネル</span>
        </div>
        {/* モバイルナビ */}
        <div className="flex overflow-x-auto gap-1 px-3 py-2">
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
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-teal-950 text-teal-400 border border-teal-900'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>
    </>
  );
}
