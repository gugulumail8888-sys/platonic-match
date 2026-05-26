import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Heart, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getAvatarUrl, calculateAge } from "@/lib/utils";
import { MARRIAGE_INTENTION_LABELS, type Profile } from "@/types";

export const metadata: Metadata = {
  title: "マッチング",
};

export default async function MatchingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // マッチング一覧取得
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      *,
      user1:profiles!user1_id(*),
      user2:profiles!user2_id(*)
    `)
    .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
    .eq("status", "active")
    .order("matched_at", { ascending: false });

  // いいね一覧（相互いいね確認用）
  const { data: receivedLikes } = await supabase
    .from("likes")
    .select(`
      *,
      sender:profiles!sender_id(*)
    `)
    .eq("receiver_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary-400" />
          マッチング
        </h1>
        <p className="text-zinc-400 text-sm">
          {matches?.length ?? 0}件のマッチングが成立しています
        </p>
      </div>

      {/* タブ */}
      <div className="flex bg-zinc-800 rounded-2xl p-1 mb-6 border border-zinc-700">
        <button className="flex-1 bg-zinc-900 rounded-xl py-2.5 text-sm font-bold text-white shadow-sm border border-zinc-700">
          マッチング ({matches?.length ?? 0})
        </button>
        <button className="flex-1 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          もらったいいね ({receivedLikes?.length ?? 0})
        </button>
      </div>

      {/* マッチング一覧 */}
      {matches && matches.length > 0 ? (
        <div className="space-y-3">
          {matches.map((match: any) => {
            const partner =
              match.user1_id === user!.id ? match.user2 : match.user1;
            if (!partner) return null;

            const age = calculateAge(partner.birth_date);
            const avatarUrl = getAvatarUrl(partner.avatar_url, partner.nickname);

            return (
              <div
                key={match.id}
                className="bg-zinc-900 rounded-2xl shadow-card border border-zinc-800 p-4 flex items-center gap-4 hover:shadow-card-hover transition-all duration-200"
              >
                <Link href={`/members/${partner.user_id}`} className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden">
                      <Image
                        src={avatarUrl}
                        alt={partner.nickname}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center shadow">
                      <Heart className="w-2.5 h-2.5 text-white fill-current" />
                    </div>
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">
                    {partner.nickname}
                    <span className="text-sm font-normal text-zinc-400 ml-1">
                      {age}歳
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 truncate">
                    {partner.prefecture} · {partner.occupation}
                  </p>
                  {partner.marriage_intention && (
                    <span className="text-xs bg-primary-950 text-primary-400 border border-primary-900 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                      {MARRIAGE_INTENTION_LABELS[partner.marriage_intention]}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/messages/${match.id}`}>
                    <Button size="sm" className="gap-1.5">
                      <MessageCircle className="w-4 h-4" />
                      トーク
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900 rounded-3xl shadow-card border border-zinc-800">
          <div className="w-20 h-20 bg-primary-950 border border-primary-900 rounded-full flex items-center justify-center mx-auto mb-5">
            <Heart className="w-10 h-10 text-primary-800" />
          </div>
          <h2 className="text-xl font-bold text-zinc-300 mb-3">
            まだマッチングがありません
          </h2>
          <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
            会員一覧でいいねを送って<br />マッチングを目指しましょう！
          </p>
          <Link href="/members">
            <Button>
              <Users className="w-4 h-4" />
              会員一覧を見る
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
