import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Handshake, Users, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";

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
  const { data: newMembers } = await supabase
    .from('profiles')
    .select('id, nickname, birth_date, prefecture, occupation')
    .eq('gender', oppositeGender)
    .eq('status', 'active')
    .neq('id', user.id)
    .not('id', 'in', `(${blockedIds.length > 0 ? blockedIds.join(',') : 'null'})`)
    .order('created_at', { ascending: false })
    .limit(6);

  const AVATAR_COLORS = ['#0d9488','#7c3aed','#db2777','#ea580c','#16a34a','#2563eb'];
  function calcAge(birthDate: string | null): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

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

      {/* 統計カード */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
          <Handshake className="w-6 h-6 text-teal-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-xs text-zinc-500 mt-1">マッチング</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
          <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-xs text-zinc-500 mt-1">いいね</p>
        </div>
      </div>

      {/* 新着会員 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">新着会員</h2>
          <Link href="/members" className="flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 transition-colors">
            すべて見る <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(newMembers ?? []).map((member, i) => (
            <Link key={member.id} href={`/members/${member.id}`}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-600 transition-all">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {member.nickname?.charAt(0)}
                </div>
                <p className="text-white font-medium text-sm">{member.nickname}</p>
                <p className="text-zinc-500 text-xs">{calcAge(member.birth_date)}歳・{member.prefecture}</p>
                <p className="text-zinc-600 text-xs mt-1">{member.occupation}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
