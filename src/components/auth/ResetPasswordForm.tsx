"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SessionState = "checking" | "valid" | "invalid";

export function ResetPasswordForm() {
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;
      setSessionState(user ? "valid" : "invalid");
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFormError(null);

    if (newPassword.length < 8) {
      setFormError("新しいパスワードは8文字以上で入力してください");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("パスワードが一致しません");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsSubmitting(false);

    if (error) {
      setServerError(error.message);
      return;
    }

    setIsSubmitted(true);
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
        <h2 className="text-xl font-bold text-white mb-6">新しいパスワードの設定</h2>

        {sessionState === "checking" && (
          <p className="text-sm text-zinc-400">確認中...</p>
        )}

        {sessionState === "invalid" && (
          <div className="space-y-4">
            <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-sm text-red-400">
              リンクの有効期限が切れているか、無効なリンクです。お使いのメールサービスのセキュリティ機能により、リンクが開く前に無効化されている場合があります。もう一度パスワード再設定をお申し込みください（メールに記載の「認証コード」を入力する方式でも設定できます）。
            </div>
            <Link
              href="/forgot-password"
              className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              パスワード再設定はこちら
            </Link>
          </div>
        )}

        {sessionState === "valid" && (
          isSubmitted ? (
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
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {(formError || serverError) && (
                <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-sm text-red-400">
                  {formError ?? serverError}
                </div>
              )}

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

              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isSubmitting}
              >
                パスワードを更新
              </Button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
