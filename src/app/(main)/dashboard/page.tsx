import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Handshake, Users, MessageCircle, Bell, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { getAvatarUrl, calculateAge } from "@/lib/utils";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "ホーム",
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // マイプロフィール取得
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  // 新着会員（最新6件）
  const { data: newMembers } = await supabase
    .from("profiles")
    .select("*")
    .neq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(6);

  // いいね数
  const { count: likeCount } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user!.id);

  // マッチング数
  const { count: matchCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
    .eq("status", "active");

  const hasProfile = !!myProfile;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* ウェルカムバナー */}
      <div className="bg-gradient-primary rounded-3xl p-6 md:p-8 text-white mb-8 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">友縁へようこそ 🤝</p>
            <h1 className="text-2xl font-bold mb-4">
              {myProfile?.nickname ?? "会員"}さん、こんにちは！
            </h1>
            {!hasProfile && (
              <Link href="/profile/edit?new=true">
                <Button
                  size="sm"
                  className="bg-white text-primary-700 hover:bg-white/90"
                >
                  <Sparkles className="w-4 h-4" />
                  プロフィールを設定する
                </Button>
              </Link>
            )}
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 rounded-full bg-white/20 overflow-hidden">
              <Image
                src={getAvatarUrl(myProfile?.avatar_url, myProfile?.nickname)}
                alt="マイアバター"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* プロフィール未設定の警告 */}
      {!hasProfile && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <Bell className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-700 font-medium">
              プロフィールを設定すると会員一覧に表示されます
            </p>
          </div>
          <Link href="/profile/edit?new=true">
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-600 hover:bg-amber-100 whitespace-nowrap">
              設定する
            </Button>
          </Link>
        </div>
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: Handshake,
            label: "もらったいいね",
            value: likeCount ?? 0,
            color: "text-primary-500",
            bg: "bg-primary-50",
            href: "/likes",
          },
          {
            icon: Users,
            label: "マッチング",
            value: matchCount ?? 0,
            color: "text-blue-500",
            bg: "bg-blue-50",
            href: "/matching",
          },
          {
            icon: MessageCircle,
            label: "メッセージ",
            value: 0,
            color: "text-purple-500",
            bg: "bg-purple-50",
            href: "/messages",
          },
          {
            icon: Bell,
            label: "お知らせ",
            value: 0,
            color: "text-orange-500",
            bg: "bg-orange-50",
            href: "/notifications",
          },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <div className="bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer">
              <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center mb-3`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1">
                {item.value}
              </div>
              <div className="text-xs text-gray-500">{item.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* 新着会員 */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            新着会員
          </h2>
          <Link
            href="/members"
            className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
          >
            すべて見る
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {newMembers && newMembers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(newMembers as Profile[]).map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                showLikeButton={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">まだ会員がいません</p>
          </div>
        )}
      </section>
    </div>
  );
}
