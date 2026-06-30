'use client';

import Link from 'next/link';
import { Heart, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12 relative">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-teal-400 transition-colors mb-4">
            ← トップページへ
          </Link>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-lg">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-wide">
            ami<span className="text-primary-400">sta</span>
          </h1>
          <p className="text-zinc-400 text-sm">友情から始まる、本物のパートナーシップ</p>
        </div>

        {/* フォームカード */}
        <div className="bg-zinc-900 rounded-3xl shadow-card border border-zinc-800 p-8">
          <h2 className="text-xl font-bold text-white mb-1">amistaに登録する</h2>
          <p className="text-sm text-zinc-400 mb-6">登録方法を選択してください</p>

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Googleで登録する
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 border-t border-zinc-700" />
            <span className="text-xs text-zinc-500">または</span>
            <div className="flex-1 border-t border-zinc-700" />
          </div>

          <Link
            href="/register"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            <Mail className="w-4 h-4" />
            メールアドレスで登録する
          </Link>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              すでにアカウントをお持ちの方は{' '}
              <Link
                href="/login"
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                ログイン
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
