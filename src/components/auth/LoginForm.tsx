"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock, Heart } from "lucide-react";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("メールアドレスの形式が正しくありません"),
  password: z
    .string()
    .min(1, "パスワードを入力してください")
    .min(6, "パスワードは6文字以上で入力してください"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    const maxAge = 60 * 60 * 24; // 24時間
    if (data.email === "test@amista.jp" && data.password === "test1234") {
      document.cookie = `auth=${JSON.stringify({ role: "user", email: data.email })}; path=/; max-age=${maxAge}`;
      router.push("/members");
    } else if (data.email === "test2@amista.jp" && data.password === "test5678") {
      document.cookie = `auth=${JSON.stringify({ role: "user", email: data.email, hasAiOption: true })}; path=/; max-age=${maxAge}`;
      router.push("/members");
    } else if (data.email === "admin@amista.jp" && data.password === "admin1234") {
      document.cookie = `auth=${JSON.stringify({ role: "admin", email: data.email })}; path=/; max-age=${maxAge}`;
      router.push("/admin");
    } else {
      setServerError("メールアドレスまたはパスワードが正しくありません");
    }
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="メールアドレス"
            type="email"
            placeholder="example@email.com"
            autoComplete="email"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="パスワード"
            type="password"
            placeholder="パスワードを入力"
            autoComplete="current-password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register("password")}
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
