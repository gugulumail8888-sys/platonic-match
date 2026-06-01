import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Handshake, Users, MessageCircle, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ホーム",
};

const DUMMY_NEW_MEMBERS = [
  { id: 1, nickname: "さくら", age: 30, prefecture: "東京都", occupation: "OL", initials: "さ", avatarColor: "#0d9488" },
  { id: 2, nickname: "ゆり", age: 27, prefecture: "大阪府", occupation: "看護師", initials: "ゆ", avatarColor: "#7c3aed" },
  { id: 3, nickname: "みらい", age: 33, prefecture: "神奈川県", occupation: "教師", initials: "み", avatarColor: "#db2777" },
  { id: 4, nickname: "あかね", age: 29, prefecture: "愛知県", occupation: "会社員", initials: "あ", avatarColor: "#ea580c" },
  { id: 5, nickname: "ひより", age: 25, prefecture: "福岡県", occupation: "デザイナー", initials: "ひ", avatarColor: "#65a30d" },
  { id: 6, nickname: "なつき", age: 31, prefecture: "北海道", occupation: "エンジニア", initials: "な", avatarColor: "#0284c7" },
];

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const nickname = user.email?.split("@")[0] ?? "ゲスト";

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
      <div className="grid grid-cols-3 gap-4 mb-8">
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
          <MessageCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-xs text-zinc-500 mt-1">メッセージ</p>
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
          {DUMMY_NEW_MEMBERS.map((member) => (
            <Link key={member.id} href={`/members/${member.id}`}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-600 transition-all">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3" style={{ background: member.avatarColor }}>
                  {member.initials}
                </div>
                <p className="text-white font-medium text-sm">{member.nickname}</p>
                <p className="text-zinc-500 text-xs">{member.age}歳・{member.prefecture}</p>
                <p className="text-zinc-600 text-xs mt-1">{member.occupation}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
