import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import {
  calculateAge,
  getAvatarUrl,
  formatDateJa,
} from "@/lib/utils";
import {
  GENDER_LABELS,
  ANNUAL_INCOME_LABELS,
  EDUCATION_LABELS,
  BODY_TYPE_LABELS,
  DRINKING_LABELS,
  SMOKING_LABELS,
  MARRIAGE_INTENTION_LABELS,
  type Profile,
} from "@/types";
import {
  Heart,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  ArrowLeft,
  MessageCircle,
  Ruler,
  Wine,
  Cigarette,
  CalendarHeart,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "会員プロフィール",
};

interface Props {
  params: { id: string };
}

export default async function MemberProfilePage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", params.id)
    .single();

  if (!profile) {
    notFound();
  }

  // いいね済みチェック
  const { data: existingLike } = await supabase
    .from("likes")
    .select("id")
    .eq("sender_id", user!.id)
    .eq("receiver_id", params.id)
    .single();

  const isLiked = !!existingLike;
  const age = calculateAge(profile.birth_date);
  const avatarUrl = getAvatarUrl(profile.avatar_url, profile.nickname);

  const details = [
    {
      icon: MapPin,
      label: "居住地",
      value: profile.prefecture,
    },
    {
      icon: Briefcase,
      label: "職業",
      value: profile.occupation,
    },
    profile.annual_income && {
      icon: Star,
      label: "年収",
      value: ANNUAL_INCOME_LABELS[profile.annual_income],
    },
    profile.education && {
      icon: GraduationCap,
      label: "最終学歴",
      value: EDUCATION_LABELS[profile.education],
    },
    profile.height && {
      icon: Ruler,
      label: "身長",
      value: `${profile.height}cm`,
    },
    profile.body_type && {
      icon: Star,
      label: "体型",
      value: BODY_TYPE_LABELS[profile.body_type],
    },
    {
      icon: Wine,
      label: "飲酒",
      value: DRINKING_LABELS[profile.alcohol],
    },
    {
      icon: Cigarette,
      label: "喫煙",
      value: SMOKING_LABELS[profile.smoking],
    },
    {
      icon: CalendarHeart,
      label: "結婚への意思",
      value: MARRIAGE_INTENTION_LABELS[profile.marriage_intention],
    },
  ].filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto">
      {/* 戻るボタン */}
      <div className="p-4">
        <Link href="/members">
          <button className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">会員一覧へ戻る</span>
          </button>
        </Link>
      </div>

      {/* メインプロフィール */}
      <div className="bg-zinc-900 rounded-3xl shadow-card border border-zinc-800 overflow-hidden mx-4 mb-4">
        {/* アバター画像 */}
        <div className="relative h-72">
          <Image
            src={avatarUrl}
            alt={profile.nickname}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* バッジ */}
          <div className="absolute top-4 left-4 flex gap-2">
            {profile.is_verified && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" />
                本人確認済み
              </span>
            )}
            {profile.is_premium && (
              <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                Premium
              </span>
            )}
          </div>

          {/* 名前・基本情報 */}
          <div className="absolute bottom-5 left-5 text-white">
            <h1 className="text-2xl font-bold">
              {profile.nickname}
              <span className="text-lg font-normal ml-2">{age}歳</span>
            </h1>
            <p className="text-sm text-white/70 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {profile.prefecture}
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="p-5 flex gap-3">
          <Button
            variant={isLiked ? "primary" : "outline"}
            fullWidth
            className="flex items-center gap-2"
          >
            <Heart className={isLiked ? "fill-current" : ""} size={18} />
            {isLiked ? "いいね済み" : "いいね！"}
          </Button>
          <Button variant="secondary" fullWidth className="flex items-center gap-2">
            <MessageCircle size={18} />
            メッセージ
          </Button>
        </div>
      </div>

      {/* 自己紹介 */}
      {profile.about_me && (
        <div className="bg-zinc-900 rounded-3xl shadow-card border border-zinc-800 p-6 mx-4 mb-4">
          <h2 className="text-base font-bold text-zinc-300 mb-3">自己紹介</h2>
          <p className="text-zinc-400 leading-relaxed text-sm whitespace-pre-line">
            {profile.about_me}
          </p>
        </div>
      )}

      {/* 趣味・好み */}
      {profile.hobbies && profile.hobbies.length > 0 && (
        <div className="bg-zinc-900 rounded-3xl shadow-card border border-zinc-800 p-6 mx-4 mb-4">
          <h2 className="text-base font-bold text-zinc-300 mb-3">趣味・興味</h2>
          <div className="flex flex-wrap gap-2">
            {profile.hobbies.map((hobby) => (
              <span
                key={hobby}
                className="bg-primary-950 border border-primary-900 text-primary-400 px-3 py-1.5 rounded-full text-sm font-medium"
              >
                {hobby}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 詳細情報 */}
      <div className="bg-zinc-900 rounded-3xl shadow-card border border-zinc-800 p-6 mx-4 mb-8">
        <h2 className="text-base font-bold text-zinc-300 mb-4">基本情報</h2>
        <div className="space-y-3">
          {details.map((detail) => {
            if (!detail) return null;
            const Icon = detail.icon;
            return (
              <div
                key={detail.label}
                className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0"
              >
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-zinc-500" />
                </div>
                <span className="text-sm text-zinc-500 w-24 flex-shrink-0">
                  {detail.label}
                </span>
                <span className="text-sm text-zinc-200 font-medium">
                  {detail.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
