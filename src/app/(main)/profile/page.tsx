import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { calculateAge, getAvatarUrl } from "@/lib/utils";
import {
  ANNUAL_INCOME_LABELS,
  EDUCATION_LABELS,
  BODY_TYPE_LABELS,
  DRINKING_LABELS,
  SMOKING_LABELS,
  MARRIAGE_INTENTION_LABELS,
  GENDER_LABELS,
  type Profile,
} from "@/types";
import {
  Edit3,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  Heart,
  Users,
  Camera,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "マイページ",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { count: likesSentCount } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", user.id);

  const { count: likesReceivedCount } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user.id);

  if (!profile) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center py-20 bg-zinc-900 rounded-3xl shadow-card border border-zinc-800">
          <div className="w-20 h-20 bg-primary-950 border border-primary-900 rounded-full flex items-center justify-center mx-auto mb-5">
            <Users className="w-10 h-10 text-primary-700" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">
            プロフィールが未設定です
          </h2>
          <p className="text-zinc-400 text-sm mb-6">
            プロフィールを設定して<br />婚活を始めましょう！
          </p>
          <Link href="/profile/edit?new=true">
            <Button size="lg">
              <Star className="w-5 h-5" />
              プロフィールを作成する
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const age = calculateAge(profile.birth_date);
  const avatarUrl = getAvatarUrl(profile.avatar_url, profile.nickname);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      {/* プロフィールカード */}
      <div className="bg-zinc-900 rounded-3xl shadow-card border border-zinc-800 overflow-hidden">
        {/* カバー */}
        <div className="h-32 bg-gradient-primary" />

        <div className="px-6 pb-6">
          {/* アバター */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl border-4 border-zinc-900 overflow-hidden shadow-lg">
                <Image
                  src={avatarUrl}
                  alt={profile.nickname}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center shadow-md hover:bg-primary-400 transition-colors">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <Link href="/profile/edit">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                <Edit3 className="w-4 h-4" />
                編集する
              </Button>
            </Link>
          </div>

          {/* 名前・基本情報 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">
                {profile.nickname}
                <span className="text-lg font-normal text-zinc-400 ml-2">
                  {age}歳
                </span>
              </h1>
              {profile.is_verified && (
                <span className="bg-blue-950 border border-blue-800 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  認証済み
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {profile.prefecture}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {profile.occupation}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-primary-400" />
                {GENDER_LABELS[profile.gender as keyof typeof GENDER_LABELS]}
              </span>
            </div>
          </div>

          {/* 統計 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-primary-950 border border-primary-900 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-primary-400 mb-0.5">
                {likesReceivedCount ?? 0}
              </div>
              <div className="text-xs text-zinc-500">もらったいいね</div>
            </div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-zinc-300 mb-0.5">
                {likesSentCount ?? 0}
              </div>
              <div className="text-xs text-zinc-500">おくったいいね</div>
            </div>
          </div>

          {/* 結婚意思タグ */}
          <div className="flex flex-wrap gap-2">
            <span className="bg-primary-950 border border-primary-900 text-primary-400 text-sm px-3 py-1 rounded-full font-medium">
              💒 {MARRIAGE_INTENTION_LABELS[profile.marriage_intention as keyof typeof MARRIAGE_INTENTION_LABELS]}
            </span>
            {profile.is_premium && (
              <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                ⭐ Premium
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 自己紹介 */}
      {profile.about_me && (
        <div className="bg-zinc-900 rounded-3xl shadow-card border border-zinc-800 p-6">
          <h2 className="font-bold text-zinc-300 mb-3">自己紹介</h2>
          <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
            {profile.about_me}
          </p>
        </div>
      )}

      {/* 詳細情報 */}
      <div className="bg-zinc-900 rounded-3xl shadow-card border border-zinc-800 p-6">
        <h2 className="font-bold text-zinc-300 mb-4">プロフィール詳細</h2>
        <div className="space-y-3">
          {[
            profile.annual_income && {
              label: "年収",
              value: ANNUAL_INCOME_LABELS[profile.annual_income as keyof typeof ANNUAL_INCOME_LABELS],
            },
            profile.education && {
              label: "最終学歴",
              value: EDUCATION_LABELS[profile.education as keyof typeof EDUCATION_LABELS],
            },
            profile.height && {
              label: "身長",
              value: `${profile.height}cm`,
            },
            profile.body_type && {
              label: "体型",
              value: BODY_TYPE_LABELS[profile.body_type as keyof typeof BODY_TYPE_LABELS],
            },
            { label: "飲酒", value: DRINKING_LABELS[profile.alcohol as keyof typeof DRINKING_LABELS] },
            {
              label: "喫煙",
              value:
                (profile.smoking as unknown as string) === "true"
                  ? "吸う"
                  : (profile.smoking as unknown as string) === "false"
                    ? "吸わない"
                    : SMOKING_LABELS[profile.smoking as keyof typeof SMOKING_LABELS],
            },
          ]
            .filter(Boolean)
            .map((item) => (
              <div
                key={item!.label}
                className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0"
              >
                <span className="text-sm text-zinc-500">{item!.label}</span>
                <span className="text-sm text-zinc-200 font-medium">
                  {item!.value}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* アカウント設定 */}
      <div className="bg-zinc-900 rounded-3xl shadow-card border border-zinc-800 p-6">
        <h2 className="font-bold text-zinc-300 mb-4">アカウント</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-zinc-500">メールアドレス</span>
            <span className="text-sm text-zinc-300">{user.email}</span>
          </div>
          <div className="pt-3 border-t border-zinc-800">
            <Link href="/settings">
              <Button variant="ghost" fullWidth className="text-left justify-start">
                設定・その他
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
