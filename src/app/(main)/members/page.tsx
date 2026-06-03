'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search, RotateCcw, ChevronDown, ChevronUp, MapPin, Briefcase, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Member {
  id: string;
  nickname: string;
  gender: string;
  birth_date: string | null;
  prefecture: string | null;
  occupation: string | null;
  body_type: string | null;
  marital_history: string | null;
  number_of_children: string | null;
  avatar_url: string | null;
}

interface FilterState {
  ageMin: string;
  ageMax: string;
  prefecture: string;
  bodyType: string;
  maritalHistory: string;
  numberOfChildren: string;
}

const EMPTY_FILTER: FilterState = {
  ageMin: '', ageMax: '', prefecture: '', bodyType: '', maritalHistory: '', numberOfChildren: '',
};

function calcAge(birthDate: string | null): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getInitials(nickname: string): string {
  return nickname.charAt(0);
}

const AVATAR_COLORS = [
  '#0d9488','#7c3aed','#db2777','#ea580c','#16a34a',
  '#2563eb','#d97706','#dc2626','#0891b2','#65a30d',
];

function MemberCard({ member, index }: { member: Member; index: number }) {
  const age = calcAge(member.birth_date);
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <Link href={`/members/${member.id}`}>
      <div className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition cursor-pointer">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ backgroundColor: color }}>
            {getInitials(member.nickname)}
          </div>
          <div>
            <div className="font-semibold text-white">{member.nickname}</div>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              {age > 0 && <span>{age}歳</span>}
              {member.prefecture && <><MapPin className="w-3 h-3" /><span>{member.prefecture}</span></>}
            </div>
          </div>
        </div>
        {member.occupation && (
          <div className="text-sm text-gray-400 flex items-center gap-1">
            <Briefcase className="w-3 h-3" /><span>{member.occupation}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function MembersPage() {
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState<FilterState>(EMPTY_FILTER);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    fetch('/api/members')
      .then((r) => r.json())
      .then((data: { members: Member[] }) => setAllMembers(data.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch('/api/blocks')
      .then((r) => r.json())
      .then((data: { blocked: string[] }) => setBlockedIds(data.blocked ?? []))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return allMembers.filter((m) => {
      if (blockedIds.includes(m.id)) return false;
      const age = calcAge(m.birth_date);
      if (appliedFilter.ageMin && age < Number(appliedFilter.ageMin)) return false;
      if (appliedFilter.ageMax && age > Number(appliedFilter.ageMax)) return false;
      if (appliedFilter.prefecture && m.prefecture !== appliedFilter.prefecture) return false;
      if (appliedFilter.bodyType && m.body_type !== appliedFilter.bodyType) return false;
      if (appliedFilter.maritalHistory && m.marital_history !== appliedFilter.maritalHistory) return false;
      if (appliedFilter.numberOfChildren && m.number_of_children !== appliedFilter.numberOfChildren) return false;
      return true;
    });
  }, [allMembers, appliedFilter, blockedIds]);

  const handleSearch = () => setAppliedFilter({ ...filter });
  const handleReset = () => { setFilter(EMPTY_FILTER); setAppliedFilter(EMPTY_FILTER); };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400">読み込み中...</div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <User className="w-6 h-6" />会員一覧
      </h1>

      {/* フィルター */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6">
        <button onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-2 text-white w-full">
          <Search className="w-4 h-4" />
          <span>絞り込み</span>
          {showFilter ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </button>
        {showFilter && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <input type="number" placeholder="年齢（下限）" value={filter.ageMin}
              onChange={(e) => setFilter({ ...filter, ageMin: e.target.value })}
              className="bg-gray-700 text-white rounded-lg p-2 text-sm" />
            <input type="number" placeholder="年齢（上限）" value={filter.ageMax}
              onChange={(e) => setFilter({ ...filter, ageMax: e.target.value })}
              className="bg-gray-700 text-white rounded-lg p-2 text-sm" />
            <input placeholder="都道府県" value={filter.prefecture}
              onChange={(e) => setFilter({ ...filter, prefecture: e.target.value })}
              className="bg-gray-700 text-white rounded-lg p-2 text-sm" />
            <input placeholder="体型" value={filter.bodyType}
              onChange={(e) => setFilter({ ...filter, bodyType: e.target.value })}
              className="bg-gray-700 text-white rounded-lg p-2 text-sm" />
            <div className="col-span-2 flex gap-2">
              <Button onClick={handleSearch} className="flex-1">検索</Button>
              <Button onClick={handleReset} variant="outline" className="flex-1">
                <RotateCcw className="w-4 h-4 mr-1" />リセット
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 会員リスト */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-12">該当する会員が見つかりませんでした</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((m, i) => <MemberCard key={m.id} member={m} index={i} />)}
        </div>
      )}
    </div>
  );
}
