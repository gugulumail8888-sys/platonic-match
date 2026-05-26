'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, RotateCcw, ChevronDown, ChevronUp, MapPin, Briefcase, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FEMALE_MEMBERS, MemberDetail } from './_data';

// ============================================================
// Constants
// ============================================================

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

const BODY_TYPES = ['がっちり', 'ぽっちゃり', 'ややぽっちゃり', '普通', '細身'];
const CHILDREN_OPTIONS = ['なし', '1人', '2人', '3人', '4人', '5人以上'];

// ============================================================
// Filter State
// ============================================================

interface FilterState {
  ageMin: string;
  ageMax: string;
  prefecture: string;
  bodyType: string;
  maritalHistory: string;
  numberOfChildren: string;
}

const EMPTY_FILTER: FilterState = {
  ageMin: '', ageMax: '', prefecture: '',
  bodyType: '', maritalHistory: '', numberOfChildren: '',
};

// ============================================================
// Sub-components
// ============================================================

const selectCls =
  'bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm ' +
  'focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors w-full';

const inputCls =
  'bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm ' +
  'placeholder-zinc-500 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors w-full';

function FilterPanel({
  filter, setFilter, onSearch, onReset,
}: {
  filter: FilterState;
  setFilter: (f: FilterState) => void;
  onSearch: () => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(true);

  const set = (key: keyof FilterState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFilter({ ...filter, [key]: e.target.value });

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 mb-8">
      {/* ヘッダー（折りたたみトグル） */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left group"
      >
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Search className="w-4 h-4 text-teal-400" />
          絞り込み検索
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          : <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
        }
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-zinc-800">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {/* 年齢（下限） */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">年齢（下限）</label>
              <input
                type="number" min="18" max="80" placeholder="例：25"
                value={filter.ageMin} onChange={set('ageMin')}
                className={inputCls}
              />
            </div>

            {/* 年齢（上限） */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">年齢（上限）</label>
              <input
                type="number" min="18" max="80" placeholder="例：40"
                value={filter.ageMax} onChange={set('ageMax')}
                className={inputCls}
              />
            </div>

            {/* 居住地 */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">居住地</label>
              <select value={filter.prefecture} onChange={set('prefecture')} className={selectCls}>
                <option value="">すべて</option>
                {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* 体型 */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">体型</label>
              <select value={filter.bodyType} onChange={set('bodyType')} className={selectCls}>
                <option value="">すべて</option>
                {BODY_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* 結婚歴 */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">結婚歴</label>
              <select value={filter.maritalHistory} onChange={set('maritalHistory')} className={selectCls}>
                <option value="">すべて</option>
                <option value="なし">なし</option>
                <option value="あり">あり</option>
              </select>
            </div>

            {/* 子供の有無 */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">お子様の有無</label>
              <select value={filter.numberOfChildren} onChange={set('numberOfChildren')} className={selectCls}>
                <option value="">すべて</option>
                {CHILDREN_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button" onClick={onReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              リセット
            </button>
            <Button type="button" onClick={onSearch} size="sm">
              <Search className="w-3.5 h-3.5" />
              検索する
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MemberCard({ member }: { member: MemberDetail }) {
  const shortHobbies =
    member.hobbies.length > 20 ? member.hobbies.slice(0, 20) + '…' : member.hobbies;

  return (
    <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 flex flex-col gap-4 hover:bg-zinc-700/60 hover:border-zinc-600 hover:shadow-lg hover:shadow-black/30 transition-all duration-200">
      {/* アバター + ニックネーム */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none"
          style={{ background: member.avatarColor }}
        >
          {member.initials}
        </div>
        <div>
          <p className="text-white font-semibold text-base leading-tight">{member.nickname}</p>
          <p className="text-zinc-400 text-sm">{member.age}歳</p>
        </div>
      </div>

      {/* 詳細情報 */}
      <div className="space-y-1.5 text-sm flex-1">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <MapPin className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
          <span>{member.prefecture}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Briefcase className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
          <span>{member.occupation}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-300">
          <User className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
          <span>{member.bodyType}</span>
        </div>
      </div>

      {/* タグ */}
      <div className="flex flex-wrap gap-1.5">
        <span className="bg-zinc-700 text-zinc-300 text-xs px-2 py-0.5 rounded-full">
          結婚歴 {member.maritalHistory}
        </span>
        <span className="bg-zinc-700 text-zinc-300 text-xs px-2 py-0.5 rounded-full">
          子供 {member.numberOfChildren}
        </span>
      </div>

      {/* 趣味 */}
      <p className="text-zinc-400 text-xs leading-relaxed border-t border-zinc-700 pt-3">
        {shortHobbies}
      </p>

      {/* プロフィールボタン */}
      <Link href={`/members/${member.id}`} className="mt-auto">
        <button
          type="button"
          className="w-full py-2 rounded-xl border border-teal-700 text-teal-400 text-sm font-medium hover:bg-teal-900/40 hover:border-teal-500 transition-colors"
        >
          プロフィールを見る
        </button>
      </Link>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function MembersPage() {
  // TODO: Supabase連携時にログインユーザーの性別を取得し、
  //       異性のメンバーのみ表示するよう実装する
  // 現時点は女性メンバー一覧を固定表示
  const allMembers = FEMALE_MEMBERS;

  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState<FilterState>(EMPTY_FILTER);

  const filtered = useMemo(() => {
    return allMembers.filter((m) => {
      if (appliedFilter.ageMin && m.age < Number(appliedFilter.ageMin)) return false;
      if (appliedFilter.ageMax && m.age > Number(appliedFilter.ageMax)) return false;
      if (appliedFilter.prefecture && m.prefecture !== appliedFilter.prefecture) return false;
      if (appliedFilter.bodyType && m.bodyType !== appliedFilter.bodyType) return false;
      if (appliedFilter.maritalHistory && m.maritalHistory !== appliedFilter.maritalHistory) return false;
      if (appliedFilter.numberOfChildren && m.numberOfChildren !== appliedFilter.numberOfChildren) return false;
      return true;
    });
  }, [allMembers, appliedFilter]);

  const handleSearch = () => setAppliedFilter({ ...filter });
  const handleReset = () => { setFilter(EMPTY_FILTER); setAppliedFilter(EMPTY_FILTER); };

  return (
    <div className="p-6 md:p-8">
      {/* ページヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
          メンバーを探す
        </h1>
      </div>

      {/* 絞り込み検索パネル */}
      <FilterPanel
        filter={filter}
        setFilter={setFilter}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      {/* メンバーカード一覧 */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-zinc-600" />
          </div>
          <p className="text-zinc-400 font-medium mb-1">
            該当するメンバーが見つかりませんでした
          </p>
          <p className="text-zinc-600 text-sm">検索条件を変更してお試しください</p>
          <button
            onClick={handleReset}
            className="mt-4 text-teal-400 text-sm hover:text-teal-300 transition-colors"
          >
            条件をリセットする
          </button>
        </div>
      )}
    </div>
  );
}
