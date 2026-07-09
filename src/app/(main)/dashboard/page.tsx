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

  // 新着会員取得（異性・最新6件）
  let newMembersQuery = supabase
    .from('profiles')
    .select('id, nickname, birth_date, prefecture, occupation')
    .eq('gender', oppositeGender)
    .in('status', ['active', 'approved'])
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
        <h1 className="text-2xl font-bold text-white mb-4">{nickname} さん 👋</h1>
        <Link href="/members">
          <Button size="sm">
            <Users className="w-4 h-4" />
            会員を探す
          </Button>
        </Link>
      </div>

      {/* 新着会員・いいねタブ */}
      <DashboardTabs newMembers={newMembers ?? []} />
    </div>
  );
}
