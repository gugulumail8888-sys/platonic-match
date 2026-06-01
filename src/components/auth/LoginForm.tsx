"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("submit", email, password);
    setServerError(null);
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (error) {
      setServerError("メールアドレスまたはパスワードが正しくありません");
      return;
    }
    window.location.href = "/dashboard";
  };

  return (
    <div className="w-full max-w-md">
      {/* ロゴ */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4">
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
        <h2 className="text-xl font-bold text-white mb-6">ログイン</h2>

        {serverError && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-4 mb-6 text-sm text-red-400">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="メールアドレス"
            type="email"
            placeholder="example@email.com"
            autoComplete="email"
            leftIcon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="パスワード"
            type="password"
            placeholder="パスワードを入力"
            autoComplete="current-password"
            leftIcon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              パスワードを忘れた方はこちら
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSubmitting}
          >
            ログイン
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-400">
            アカウントをお持ちでない方は{" "}
            <Link
              href="/register"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              新規登録
            </Link>
          </p>
        </div>
      </div>

      {/* デモアカウント情報 */}
      <div className="text-center text-xs text-zinc-600 mt-6 space-y-1">
        <p>デモ用アカウント：test@amista.jp / test1234</p>
        <p>AIオプション付き：test2@amista.jp / test5678</p>
        <p>管理者アカウント：admin@amista.jp / admin1234</p>
      </div>

      {/* 注意書き */}
      <p className="text-center text-xs text-zinc-600 mt-4">
        ログインすることで
        <Link href="/terms" className="text-primary-600 hover:underline mx-1">
          利用規約
        </Link>
        および
        <Link href="/privacy" className="text-primary-600 hover:underline mx-1">
          プライバシーポリシー
        </Link>
        に同意したことになります
      </p>
    </div>
  );
}
