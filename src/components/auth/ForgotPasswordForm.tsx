"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Heart, KeyRound, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "code" | "done";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const supabase = createClient();

  const sendResetEmail = async () => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    });
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setIsSubmitting(true);
    await sendResetEmail();
    setIsSubmitting(false);
    // メールアドレスの存在有無を外部に漏らさないため、エラーの有無に関わらず次のステップへ進む
    setStep("code");
  };

  const handleResendCode = async () => {
    setServerError(null);
    setResendMessage(null);
    setIsResending(true);
    await sendResetEmail();
    setIsResending(false);
    setCode("");
    setResendMessage("新しい認証コードを送信しました。メールをご確認ください。");
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setServerError(null);

    if (newPassword.length < 8) {
      setFormError("新しいパスワードは8文字以上で入力してください");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("パスワードが一致しません");
      return;
    }

    setIsSubmitting(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "recovery",
    });

    if (verifyError) {
      setIsSubmitting(false);
      setServerError("認証コードが正しくないか、有効期限が切れています。メールに記載のコードをご確認のうえ、もう一度お試しください。");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setIsSubmitting(false);

    if (updateError) {
      setServerError(updateError.message);
      return;
    }

    setStep("done");
  };

  return (
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
        <h2 className="text-xl font-bold text-white mb-6">パスワード再設定</h2>

        {serverError && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-4 mb-6 text-sm text-red-400">
            {serverError}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleSendEmail} className="space-y-5">
            <Input
              label="メールアドレス"
              type="email"
              placeholder="example@email.com"
              autoComplete="email"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
              認証コードを送信
            </Button>
          </form>
        )}

        {step === "code" && (
          <div className="space-y-5">
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-300">
              {email} 宛に認証コードをお送りしました(登録がない場合は届きません)。メール内の「認証コード」を下記に入力し、新しいパスワードを設定してください。
              <br />
              <span className="text-zinc-500 text-xs">
                ※メール内のリンクは、メールサービス側のセキュリティスキャンにより無効化される場合があります。その場合もこちらのコード入力方式であれば設定いただけます。
              </span>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-5">
              {formError && (
                <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-sm text-red-400">
                  {formError}
                </div>
              )}

              <Input
                label="認証コード"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                leftIcon={<KeyRound className="w-4 h-4" />}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />

              <Input
                label="新しいパスワード"
                type="password"
                placeholder="8文字以上で入力"
                autoComplete="new-password"
                leftIcon={<Lock className="w-4 h-4" />}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="新しいパスワード（確認）"
                type="password"
                placeholder="もう一度入力"
                autoComplete="new-password"
                leftIcon={<Lock className="w-4 h-4" />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
                パスワードを更新
              </Button>
            </form>

            {resendMessage && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-300">
                {resendMessage}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors disabled:opacity-50"
              >
                {isResending ? "送信中..." : "認証コードを再送信する"}
              </button>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                メールアドレスを入力し直す
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-6">
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-300">
              パスワードを更新しました
            </div>
            <Link href="/login">
              <Button type="button" fullWidth size="lg">
                ログイン画面へ
              </Button>
            </Link>
          </div>
        )}

        {step !== "done" && (
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              ログイン画面に戻る
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
