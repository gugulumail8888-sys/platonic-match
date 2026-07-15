'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Sparkles, Heart, HeartHandshake } from 'lucide-react';
import { LikesSentTab, LikesReceivedTab } from './LikesTabs';

interface NewMember {
  id: string;
  nickname: string;
  birth_date: string | null;
  prefecture: string | null;
  occupation: string | null;
}

type DashboardTabId = 'new-members' | 'likes-sent' | 'likes-received';

const DASHBOARD_TABS: { id: DashboardTabId; label: string; icon: React.ElementType }[] = [
  { id: 'new-members',    label: '新着会員',   icon: Sparkles },
  { id: 'likes-sent',     label: 'いいね送信', icon: Heart },
  { id: 'likes-received', label: 'いいね受信', icon: HeartHandshake },
];

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

function NewMembersGrid({ newMembers }: { newMembers: NewMember[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">新着会員</h2>
        <Link href="/members" className="flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 transition-colors">
          すべて見る <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {newMembers.map((member, i) => (
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
  );
}

export default function DashboardTabs({ newMembers, mutualCount }: { newMembers: NewMember[]; mutualCount: number }) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<DashboardTabId>('new-members');

  useEffect(() => {
    if (searchParams.get('tab') === 'likes-received') {
      setActiveTab('likes-received');
    }
  }, [searchParams]);

  return (
    <div>
      {/* タブナビゲーション */}
      <div className="flex border-b border-zinc-800 mb-6 gap-1">
        {DASHBOARD_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-1.5 px-4 py-3 flex-1 text-sm font-medium transition-all duration-200 border-b-2 -mb-px focus:outline-none ${
                isActive
                  ? 'border-teal-500 text-teal-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-zinc-500'}`} />
              {label}
              {id === 'likes-received' && mutualCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-pink-600 text-white text-[10px] font-bold">
                  {mutualCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'new-members'    && <NewMembersGrid newMembers={newMembers} />}
      {activeTab === 'likes-sent'     && <LikesSentTab />}
      {activeTab === 'likes-received' && <LikesReceivedTab />}
    </div>
  );
}
