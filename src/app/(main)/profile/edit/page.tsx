import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ProfileForm, type ProfileEditData } from "@/components/profile/ProfileForm";
import { UserCircle, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "プロフィール編集",
};

interface Props {
  searchParams: { new?: string };
}

export default async function ProfileEditPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const isNew = searchParams.new === "true";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-8">
        {isNew ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-950 border border-primary-800 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              プロフィールを作成しましょう！
            </h1>
            <p className="text-zinc-400 text-sm">
              詳しく入力するほど、マッチング率が上がります ✨
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <UserCircle className="w-7 h-7 text-primary-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                プロフィール編集
              </h1>
              <p className="text-sm text-zinc-400">
                プロフィールを更新して魅力をアピールしましょう
              </p>
            </div>
          </div>
        )}
      </div>

      {/* フォーム */}
      <div className="bg-zinc-900 rounded-3xl shadow-card border border-zinc-800 p-6 md:p-8">
        <ProfileForm
          initialData={profile as Partial<ProfileEditData> | undefined}
          isNew={isNew}
        />
      </div>
    </div>
  );
}
