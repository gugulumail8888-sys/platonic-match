'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search, RotateCcw, ChevronDown, ChevronUp, MapPin, Briefcase, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ============================================================
// Constants
// ============================================================

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

const BODY_TYPES = ['細め', '普通', 'しっかり', 'ぽっちゃり', '筋肉質'];

const INCOME_OPTIONS = [
  { value: '300万未満', label: '300万未満' },
  { value: '300-500万', label: '300〜500万' },
  { value: '500-700万', label: '500〜700万' },
  { value: '700-1000万', label: '700〜1000万' },
  { value: '1000万以上', label: '1000万以上' },
];

const MARRIAGE_TIMING_OPTIONS = [
  { value: 'すぐにでも', label: 'すぐにでも' },
  { value: '1年以内', label: '1年以内' },
  { value: '2-3年以内', label: '2〜3年以内' },
  { value: '未定', label: '未定' },
];

const CHILDREN_DESIRE_OPTIONS = [
  { value: 'ほしい', label: 'ほしい' },
  { value: 'ほしくない', label: 'ほしくない' },
  { value: 'どちらでもよい', label: 'どちらでもよい' },
];

// ============================================================
// Types
// ============================================================

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
  smoking: string | null;
  drinking: string | null;
  income: string | null;
  marriage_timing: string | null;
  children_desire: string | null;
  avatar_url: string | null;
}

interface FilterState {
  ageMin: string;
  ageMax: string;
  prefecture: string;
  bodyType: string;
  maritalHistory: string;
  numberOfChildren: string;
  smoking: string;
  drinking: string;
  occupation: string;
  income: string;
  marriageTiming: string;
  childrenDesire: string;
}

const EMPTY_FILTER: FilterState = {
  ageMin: '', ageMax: '', prefecture: '', bodyType: '', maritalHistory: '', numberOfChildren: '',
  smoking: '', drinking: '', occupation: '', income: '', marriageTiming: '', childrenDesire: '',
};

// ============================================================
// Helpers
// ============================================================

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

const selectCls = 'bg-gray-700 text-white rounded-lg p-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-teal-600';
const inputCls  = 'bg-gray-700 text-white rounded-lg p-2 text-sm w-full placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-600';

// ============================================================
// Sub-components
// ============================================================

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

// ============================================================
// Page
// ============================================================

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
      if (appliedFilter.smoking && m.smoking !== appliedFilter.smoking) return false;
      if (appliedFilter.drinking && m.drinking !== appliedFilter.drinking) return false;
      if (appliedFilter.occupation && !m.occupation?.includes(appliedFilter.occupation)) return false;
      if (appliedFilter.income && m.income !== appliedFilter.income) return false;
      if (appliedFilter.marriageTiming && m.marriage_timing !== appliedFilter.marriageTiming) return false;
      if (appliedFilter.childrenDesire && m.children_desire !== appliedFilter.childrenDesire) return false;
      return true;
    });
  }, [allMembers, appliedFilter, blockedIds]);

  const handleSearch = () => setAppliedFilter({ ...filter });
  const handleReset = () => { setFilter(EMPTY_FILTER); setAppliedFilter(EMPTY_FILTER); };

  const set = (key: keyof FilterState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilter((prev) => ({ ...prev, [key]: e.target.value }));

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
          <div className="mt-4 space-y-4">
            {/* 年齢・都道府県・体型 */}
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="年齢（下限）" value={filter.ageMin}
                onChange={set('ageMin')} className={inputCls} />
              <input type="number" placeholder="年齢（上限）" value={filter.ageMax}
                onChange={set('ageMax')} className={inputCls} />

              <select value={filter.prefecture} onChange={set('prefecture')} className={selectCls}>
                <option value="">都道府県（指定なし）</option>
                {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>

              <select value={filter.bodyType} onChange={set('bodyType')} className={selectCls}>
                <option value="">体型（指定なし）</option>
                {BODY_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* 職業 */}
            <input placeholder="職業（キーワード）" value={filter.occupation}
              onChange={set('occupation')} className={inputCls} />

            {/* 喫煙・飲酒・年収 */}
            <div className="grid grid-cols-2 gap-3">
              <select value={filter.smoking} onChange={set('smoking')} className={selectCls}>
                <option value="">喫煙（指定なし）</option>
                <option value="あり">あり</option>
                <option value="なし">なし</option>
              </select>

              <select value={filter.drinking} onChange={set('drinking')} className={selectCls}>
                <option value="">飲酒（指定なし）</option>
                <option value="あり">あり</option>
                <option value="なし">なし</option>
              </select>

              <select value={filter.income} onChange={set('income')} className={selectCls}>
                <option value="">年収（指定なし）</option>
                {INCOME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              <select value={filter.marriageTiming} onChange={set('marriageTiming')} className={selectCls}>
                <option value="">結婚のタイミング（指定なし）</option>
                {MARRIAGE_TIMING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* 子どもの希望 */}
            <select value={filter.childrenDesire} onChange={set('childrenDesire')} className={selectCls}>
              <option value="">子どもの希望（指定なし）</option>
              {CHILDREN_DESIRE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* ボタン */}
            <div className="flex gap-2">
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
