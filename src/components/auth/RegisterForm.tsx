"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock, Users, CheckCircle } from "lucide-react";

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "メールアドレスを入力してください")
      .email("メールアドレスの形式が正しくありません"),
    password: z
      .string()
      .min(6, "パスワードは6文字以上で入力してください")
      .regex(/[A-Za-z]/, "英字を含めてください")
      .regex(/[0-9]/, "数字を含めてください"),
    password_confirm: z.string().min(1, "パスワード（確認）を入力してください"),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "パスワードが一致しません",
    path: ["password_confirm"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setServerError(translateAuthError(error.message));
      return;
    }

    // メール確認が不要な場合（開発環境）
    setIsSuccess(true);
    setTimeout(() => {
      router.push("/profile/edit?new=true");
      router.refresh();
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-3xl shadow-card p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">登録完了！</h2>
          <p className="text-gray-500 text-sm mb-4">
            プロフィール設定画面へ移動します...
          </p>
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* ロゴ */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-lg">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">
          友<span className="text-primary-500">縁</span>
          <span className="text-base font-normal text-gray-400 ml-1">ゆうえん</span>
        </h1>
        <p className="text-gray-500 text-sm">友情から始まる、本物のパートナーシップ</p>
      </div>

      {/* フォームカード */}
      <div className="bg-white rounded-3xl shadow-card p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">新規会員登録</h2>
        <p className="text-sm text-gray-500 mb-6">
          完全無料で始められます
        </p>

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600">
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
            required
            {...register("email")}
          />

          <Input
            label="パスワード"
            type="password"
            placeholder="英数字6文字以上"
            autoComplete="new-password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            hint="英字と数字を含む6文字以上で設定してください"
            required
            {...register("password")}
          />

          <Input
            label="パスワード（確認）"
            type="password"
            placeholder="もう一度入力してください"
            autoComplete="new-password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password_confirm?.message}
            required
            {...register("password_confirm")}
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSubmitting}
          >
            無料で登録する
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            すでにアカウントをお持ちの方は{" "}
            <Link
              href="/login"
              className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
            >
              ログイン
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        登録することで
        <Link href="/terms" className="text-primary-400 hover:underline mx-1">
          利用規約
        </Link>
        および
        <Link href="/privacy" className="text-primary-400 hover:underline mx-1">
          プライバシーポリシー
        </Link>
        に同意したことになります
      </p>
    </div>
  );
}
