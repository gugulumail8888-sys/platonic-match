import Link from 'next/link';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
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
      <main className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </main>
      {/* フッター */}
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
      <ScrollToTop />
    </div>
  );
}
