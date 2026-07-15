'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Eye, HeartHandshake } from 'lucide-react';

interface LikeMember {
  id: string;
  nickname: string;
  birth_date: string | null;
  prefecture: string | null;
  isMutual?: boolean;
}

const AVATAR_COLORS = ['#0d9488','#2563eb','#7c3aed','#b45309','#be123c','#0f766e','#c2410c','#4f46e5'];

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function avatarColor(id: string): string {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

export function LikeMemberCard({ member }: { member: LikeMember }) {
  const age = calcAge(member.birth_date);
  const initial = member.nickname.charAt(0);
  const bg = avatarColor(member.id);
  return (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-4 flex items-center gap-4 hover:bg-zinc-700/60 hover:border-zinc-600 transition-all duration-200">
      {/* アバター */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none"
        style={{ background: bg }}
      >
        {initial}
      </div>

      {/* 情報 */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm leading-tight">{member.nickname}</p>
        {age !== null && <p className="text-zinc-400 text-xs mt-0.5">{age}歳</p>}
        {member.prefecture && (
          <p className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-teal-600" />
            {member.prefecture}
          </p>
        )}
        {member.isMutual && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-pink-900/50 text-pink-300 border border-pink-800 mt-1">
            💑 相互いいね
          </span>
        )}
      </div>

      {/* リンク */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/members/${member.id}`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-teal-700 text-teal-400 text-xs font-medium hover:bg-teal-900/40 hover:border-teal-500 transition-colors"
        >
          <Eye className="w-3 h-3" />
          プロフィールを見る
        </Link>
        {member.isMutual && (
          <Link
            href={`/members/${member.id}?apply=1`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-pink-700 text-pink-400 text-xs font-medium hover:bg-pink-900/40 hover:border-pink-500 transition-colors"
          >
            <HeartHandshake className="w-3 h-3" />
            お見合いを申請する
          </Link>
        )}
      </div>
    </div>
  );
}

export function LikesSentTab() {
  const [members, setMembers] = React.useState<LikeMember[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/likes')
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-zinc-400 py-12">読み込み中...</div>;
  if (members.length === 0) return <div className="text-center text-zinc-500 py-12">いいねしたメンバーはいません</div>;
  return (
    <div className="space-y-2">
      {members.map((m) => <LikeMemberCard key={m.id} member={m} />)}
    </div>
  );
}

export function LikesReceivedTab() {
  const [members, setMembers] = React.useState<LikeMember[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/likes/received')
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-zinc-400 py-12">読み込み中...</div>;
  if (members.length === 0) return <div className="text-center text-zinc-500 py-12">いいねされたメンバーはいません</div>;
  return (
    <div className="space-y-2">
      {members.map((m) => <LikeMemberCard key={m.id} member={m} />)}
    </div>
  );
}
