import { cookies } from 'next/headers';
import Link from 'next/link';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/ui/Navbar';
import { AdminSidebar } from '@/app/admin/_components/AdminSidebar';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const authCookie = (await cookies()).get('auth')?.value;
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

  const isAdmin = role === 'admin';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pt-9">
      {isAdmin ? (
        <AdminSidebar />
      ) : role ? (
        <Navbar role={role} hasAiOption={hasAiOption} />
      ) : null}
      {/* ヘッダー */}
      {!role && (
        <header className="sticky top-9 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            {user ? (
              <Link href="/dashboard" className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
                ダッシュボードに戻る
              </Link>
            ) : (
              <Link href="/" className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
                トップページへ
              </Link>
            )}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">a</span>
                </div>
                <span className="text-white font-bold text-lg">amista</span>
              </Link>
            </div>
          </div>
        </header>
      )}
      <main className={isAdmin ? 'lg:ml-56' : role ? 'lg:ml-64' : ''}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
      {/* フッター */}
      {/* 変更前: isAdmin/roleに関係なく常に表示されていたため、ログイン済み(管理者・一般会員)でも
          このpublic用フッターが重複表示されていた。未ログイン時のみ表示するよう !role で囲む。
      <footer className="border-t border-zinc-800 px-6 py-6 mt-8">
        <nav className="flex flex-wrap justify-center gap-6 text-sm text-zinc-400">
          <Link href="/terms" className="hover:text-white transition-colors">利用規約</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link>
          <Link href="/tokusho" className="hover:text-white transition-colors">特定商取引法</Link>
          <Link href="/contact" className="hover:text-white transition-colors">お問い合わせ</Link>
          <Link href="/help" className="hover:text-white transition-colors">ヘルプ</Link>
          <Link href="/cancel-policy" className="hover:text-white transition-colors">キャンセルポリシー</Link>
        </nav>
      </footer>
      */}
      {!role && (
        <footer className="border-t border-zinc-800 px-6 py-6 mt-8">
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-zinc-400">
            <Link href="/terms" className="hover:text-white transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link>
            <Link href="/tokusho" className="hover:text-white transition-colors">特定商取引法</Link>
            <Link href="/contact" className="hover:text-white transition-colors">お問い合わせ</Link>
            <Link href="/help" className="hover:text-white transition-colors">ヘルプ</Link>
            <Link href="/cancel-policy" className="hover:text-white transition-colors">キャンセルポリシー</Link>
          </nav>
        </footer>
      )}
      <ScrollToTop />
    </div>
  );
}
