"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Briefcase, GraduationCap, Star } from "lucide-react";
import { type Profile } from "@/types";
import {
  calculateAge,
  cn,
  getAvatarUrl,
} from "@/lib/utils";
import {
  GENDER_LABELS,
  ANNUAL_INCOME_LABELS,
  EDUCATION_LABELS,
  MARRIAGE_INTENTION_LABELS,
} from "@/types";

interface ProfileCardProps {
  profile: Profile;
  onLike?: (profileId: string) => void;
  isLiked?: boolean;
  showLikeButton?: boolean;
  variant?: "grid" | "list" | "featured";
}

export function ProfileCard({
  profile,
  onLike,
  isLiked = false,
  showLikeButton = true,
  variant = "grid",
}: ProfileCardProps) {
  const age = calculateAge(profile.birth_date);
  const avatarUrl = getAvatarUrl(profile.avatar_url, profile.nickname);

  if (variant === "featured") {
    return (
      <div className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group">
        <div className="relative h-72">
          <Image
            src={avatarUrl}
            alt={profile.nickname}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {profile.is_verified && (
            <div className="absolute top-4 left-4 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" />
              認証済み
            </div>
          )}

          {profile.is_premium && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-2 py-1 rounded-full">
              Premium
            </div>
          )}

          <div className="absolute bottom-4 left-4 text-white">
            <h3 className="text-xl font-bold">
              {profile.nickname}
              <span className="text-base font-normal ml-2">{age}歳</span>
            </h3>
            <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {profile.prefecture}
            </p>
          </div>

          {showLikeButton && (
            <button
              onClick={() => onLike?.(profile.id)}
              className={cn(
                "absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg",
                isLiked
                  ? "bg-primary-500 text-white scale-110"
                  : "bg-white text-gray-400 hover:bg-primary-50 hover:text-primary-500 hover:scale-110"
              )}
            >
              <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
            </button>
          )}
        </div>

        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {profile.marriage_intention && (
              <span className="text-xs bg-primary-50 text-primary-600 px-3 py-1 rounded-full font-medium">
                💒 {MARRIAGE_INTENTION_LABELS[profile.marriage_intention]}
              </span>
            )}
            {profile.occupation && (
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {profile.occupation}
              </span>
            )}
          </div>
          {profile.about_me && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">
              {profile.about_me}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link href={`/members/${profile.user_id}`}>
      <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group cursor-pointer">
        <div className="relative h-48">
          <Image
            src={avatarUrl}
            alt={profile.nickname}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {profile.is_verified && (
            <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" />
              認証
            </div>
          )}

          {showLikeButton && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onLike?.(profile.id);
              }}
              className={cn(
                "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow",
                isLiked
                  ? "bg-primary-500 text-white"
                  : "bg-white/90 text-gray-400 hover:text-primary-500"
              )}
            >
              <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
            </button>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-bold text-gray-800">
              {profile.nickname}
              <span className="text-sm font-normal text-gray-500 ml-1">{age}歳</span>
            </h3>
            <span className="text-xs text-gray-400 flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {profile.prefecture}
            </span>
          </div>

          <div className="space-y-1">
            {profile.occupation && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-gray-400" />
                {profile.occupation}
              </p>
            )}
            {profile.education && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-gray-400" />
                {EDUCATION_LABELS[profile.education]}
              </p>
            )}
          </div>

          {profile.marriage_intention && (
            <div className="mt-3">
              <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                {MARRIAGE_INTENTION_LABELS[profile.marriage_intention]}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
