'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search, RotateCcw, MapPin, ArrowUp, ArrowDown } from 'lucide-react';

// ── 型定義 ────────────────────────────────────────────────────

export type MemberStatus = 'pending' | 'approved' | 'verified' | 'rejected' | 'withdrawn';

export interface MemberRow {
  id: string;
  nickname: string;
  gender: string;
  birth_date: string;
  prefecture: string;
  occupation: string;
  avatar_url: string | null;
  avatar_color: string | null;
  status: MemberStatus;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  email: string;
}

// ── 定数 ──────────────────────────────────────────────────────

export const MEMBER_STATUS_CONFIG: Record<MemberStatus, { label: string; className: string }> = {
  pending:   { label: '審査中',       className: 'bg-amber-900/50 text-amber-300 border border-amber-800' },
  approved:  { label: '承認済み',     className: 'bg-green-900/50 text-green-300 border border-green-800' },
  verified:  { label: '手動チェック済み', className: 'bg-teal-900/50 text-teal-300 border border-teal-800' },
  rejected:  { label: '拒否',         className: 'bg-zinc-700 text-zinc-400 border border-zinc-600' },
  withdrawn: { label: '退会済み',     className: 'bg-zinc-800 text-zinc-500 border border-zinc-700' },
};

type GenderFilter = 'all' | 'male' | 'female';
type StatusFilter = 'all' | MemberStatus;

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'すべて' },
  { value: 'pending',   label: '審査中' },
  { value: 'approved',  label: '承認済み' },
  { value: 'verified',  label: '手動チェック済み' },
  { value: 'rejected',  label: '拒否' },
  { value: 'withdrawn', label: '退会済み' },
];

// ── ヘルパー ──────────────────────────────────────────────────

function calcAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── ソート ────────────────────────────────────────────────────

type SortKey = 'id' | 'member' | 'gender' | 'age' | 'prefecture' | 'created_at' | 'status' | 'blockCount';
type SortDirection = 'asc' | 'desc';

const SORTABLE_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'id',         label: 'ID'         },
  { key: 'member',     label: '会員'       },
  { key: 'gender',     label: '性別'       },
  { key: 'age',        label: '年齢'       },
  { key: 'prefecture', label: '居住地'     },
  { key: 'created_at', label: '登録日'     },
  { key: 'status',     label: 'ステータス' },
  { key: 'blockCount', label: 'ブロック数' },
];

function getSortValue(row: MemberRow, key: SortKey, blockCounts: Record<string, number>): string | number {
  switch (key) {
    case 'id':         return row.id;
    case 'member':     return row.nickname;
    case 'gender':     return row.gender;
    case 'age':        return calcAge(row.birth_date);
    case 'prefecture': return row.prefecture;
    case 'created_at': return new Date(row.created_at).getTime();
    case 'status':     return row.status;
    case 'blockCount': return blockCounts[row.id] ?? 0;
  }
}

// ── サブコンポーネント ─────────────────────────────────────────

function StatusBadges({ status, isSuspended }: { status: MemberStatus; isSuspended: boolean }) {
  const cfg = MEMBER_STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-zinc-700 text-zinc-300 border border-zinc-600',
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
        {cfg.label}
      </span>
      {isSuspended && (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-900/50 text-red-300 border border-red-800">
          🔒 停止中
        </span>
      )}
    </div>
  );
}

function MemberChip({ row }: { row: MemberRow }) {
  return (
    <div className="flex items-center gap-2.5">
      {row.avatar_url ? (
        <img src={row.avatar_url} alt={row.nickname} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: row.avatar_color ?? '#0d9488' }}
        >
          {row.nickname.charAt(0)}
        </div>
      )}
      <div>
        <p className="text-zinc-100 font-medium">{row.nickname}</p>
        <p className="text-zinc-500 text-xs">{row.email}</p>
      </div>
    </div>
  );
}

// ── メインコンポーネント ───────────────────────────────────────

export default function AdminMembersClient({
  members,
  approveMember,
  suspendMember,
  unsuspendMember,
}: {
  members: MemberRow[];
  approveMember: (formData: FormData) => Promise<void>;
  suspendMember: (formData: FormData) => Promise<void>;
  unsuspendMember: (formData: FormData) => Promise<void>;
}) {
  const [search, setSearch]             = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [blockCounts, setBlockCounts]   = useState<Record<string, number>>({});
  const [sortKey, setSortKey]           = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetch('/api/blocks/counts')
      .then((r) => r.json())
      .then((data: { counts: Record<string, number> }) => setBlockCounts(data.counts))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (search && !m.nickname.includes(search)) return false;
      if (genderFilter !== 'all' && m.gender !== genderFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      return true;
    });
  }, [members, search, genderFilter, statusFilter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = getSortValue(a, sortKey, blockCounts);
      const vb = getSortValue(b, sortKey, blockCounts);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [filtered, sortKey, sortDirection, blockCounts]);

  const handleReset = () => {
    setSearch('');
    setGenderFilter('all');
    setStatusFilter('all');
  };

  const selectCls =
    'bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm ' +
    'focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors';

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-white">会員管理</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          全 {members.length} 名（表示 {filtered.length} 名）
        </p>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ニックネームで検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">性別</label>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as GenderFilter)}
            className={selectCls}
          >
            <option value="all">すべて</option>
            <option value="female">女性</option>
            <option value="male">男性</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">ステータス</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={selectCls}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          リセット
        </button>
      </div>

      {/* テーブル */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="border-b border-zinc-800">
              <tr>
                {SORTABLE_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left px-4 py-3 text-xs text-zinc-400 font-medium uppercase tracking-wider cursor-pointer select-none hover:text-zinc-200 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        sortDirection === 'asc'
                          ? <ArrowUp className="w-3 h-3" />
                          : <ArrowDown className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-xs text-zinc-400 font-medium uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                    該当する会員が見つかりませんでした
                  </td>
                </tr>
              ) : (
                sorted.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-800/50 transition-colors">
                    {/* ID */}
                    <td className="px-4 py-3 text-zinc-500 text-xs font-mono">
                      {row.id.slice(0, 8).toUpperCase()}
                    </td>

                    {/* 会員 */}
                    <td className="px-4 py-3">
                      <MemberChip row={row} />
                    </td>

                    {/* 性別 */}
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {row.gender === 'male' ? '男性' : row.gender === 'female' ? '女性' : 'その他'}
                    </td>

                    {/* 年齢 */}
                    <td className="px-4 py-3 text-zinc-400 text-xs">{calcAge(row.birth_date)}歳</td>

                    {/* 居住地 */}
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-teal-500 flex-shrink-0" />
                        {row.prefecture}
                      </span>
                    </td>

                    {/* 登録日 */}
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {new Date(row.created_at).toLocaleDateString('ja-JP')}
                    </td>

                    {/* ステータス */}
                    <td className="px-4 py-3">
                      <StatusBadges status={row.status} isSuspended={row.is_suspended} />
                    </td>

                    {/* ブロック数 */}
                    <td className="px-4 py-3 text-center">
                      {(blockCounts[row.id] ?? 0) > 0 ? (
                        <span className="text-xs font-semibold text-red-400 bg-red-900/30 border border-red-800 px-2 py-0.5 rounded-full">
                          {blockCounts[row.id]}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">0</span>
                      )}
                    </td>

                    {/* 操作 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/admin/members/${row.id}`}
                          className="text-xs px-2.5 py-1 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                        >
                          詳細
                        </Link>

                        {row.status !== 'approved' && (
                          <form action={approveMember}>
                            <input type="hidden" name="id" value={row.id} />
                            <button
                              type="submit"
                              className="text-xs px-2.5 py-1 rounded-lg border border-green-800 text-green-400 hover:bg-green-900/40 transition-colors"
                            >
                              承認
                            </button>
                          </form>
                        )}

                        {!row.is_suspended && (
                          <form action={suspendMember}>
                            <input type="hidden" name="id" value={row.id} />
                            <button
                              type="submit"
                              className="text-xs px-2.5 py-1 rounded-lg border border-red-900 text-red-400 hover:bg-red-900/30 transition-colors"
                            >
                              停止
                            </button>
                          </form>
                        )}

                        {row.is_suspended && (
                          <form action={unsuspendMember}>
                            <input type="hidden" name="id" value={row.id} />
                            <button
                              type="submit"
                              className="text-xs px-2.5 py-1 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                            >
                              停止解除
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-zinc-800 text-xs text-zinc-500">
          {filtered.length} 名表示 / 全 {members.length} 名
        </div>
      </div>
    </div>
  );
}
