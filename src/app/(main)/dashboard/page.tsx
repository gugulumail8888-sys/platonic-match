import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import DashboardTabs from "../_components/DashboardTabs";

export const metadata: Metadata = {
  title: "ホーム",
};

// DUMMY_NEW_MEMBERS removed

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ログインユーザーのプロフィール取得
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('nickname, gender')
    .eq('id', user.id)
    .maybeSingle();

  const nickname = myProfile?.nickname ?? user.email?.split("@")[0] ?? "ゲスト";
  const oppositeGender = myProfile?.gender === 'male' ? 'female' : 'male';

  // ブロックリスト取得
  const { data: blockedData } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', user.id);
  const blockedIds = (blockedData ?? []).map((b) => b.blocked_id);

  // 自分が送ったいいね
  const { data: sentLikes } = await supabase
    .from('likes')
    .select('liked_id')
    .eq('liker_id', user.id);
  const sentIds = new Set((sentLikes ?? []).map((l) => l.liked_id));

  // 自分が受け取ったいいね（自分がブロックした相手は除く）
  const { data: receivedLikes } = await supabase
    .from('likes')
    .select('liker_id')
    .eq('liked_id', user.id);
  const mutualCount = (receivedLikes ?? []).filter(
    (l) => sentIds.has(l.liker_id) && !blockedIds.includes(l.liker_id)
  ).length;

  // 新着会員取得（異性・最新6件）
  let newMembersQuery = supabase
    .from('profiles')
    .select('id, nickname, birth_date, prefecture, occupation')
    .eq('gender', oppositeGender)
    .in('status', ['approved', 'verified'])
    .neq('id', user.id);

  if (blockedIds.length > 0) {
    newMembersQuery = newMembersQuery.not('id', 'in', `(${blockedIds.join(',')})`);
  }

  const { data: newMembers } = await newMembersQuery
    .order('created_at', { ascending: false })
    .limit(6);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* ウェルカムバナー */}
      <div className="bg-gradient-to-r from-teal-900/50 to-zinc-900 border border-teal-800/50 rounded-2xl p-6 mb-8">
        <p className="text-zinc-400 text-sm mb-1">おかえりなさい</p>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h1 className="text-2xl font-bold text-white">{nickname} さん 👋</h1>
          {mutualCount > 0 && (
            <Link
              href="/dashboard?tab=likes-received"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-900/50 text-pink-300 border border-pink-800 text-xs font-medium hover:bg-pink-900/70 transition-colors animate-pulse"
            >
              💑 相互いいねがあります！「いいね受信」を確認
            </Link>
          )}
        </div>
        <Link href="/members">
          <Button size="sm">
            <Users className="w-4 h-4" />
            会員を探す
          </Button>
        </Link>
      </div>

      {/* 新着会員・いいねタブ */}
      <DashboardTabs newMembers={newMembers ?? []} mutualCount={mutualCount} />
    </div>
  );
}
