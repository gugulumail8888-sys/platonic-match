'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, RotateCcw, MapPin, ExternalLink } from 'lucide-react';
import {
  ADMIN_MEMBERS, MEMBER_STATUS_CONFIG,
  type AdminMember, type MemberStatus,
} from '../_data';

// ============================================================
// フィルター型
// ============================================================

type GenderFilter = 'all' | 'male' | 'female';
type StatusFilter = 'all' | MemberStatus;

// ============================================================
// Sub-components
// ============================================================

function StatusBadge({ status }: { status: MemberStatus }) {
  const cfg = MEMBER_STATUS_CONFIG[status];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function ActionButton({
  label, variant, onClick,
}: {
  label: string;
  variant: 'approve' | 'suspend' | 'detail';
  onClick: () => void;
}) {
  const cls =
    variant === 'detail'
      ? 'border border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white'
      : variant === 'approve'
      ? 'border border-green-800 text-green-400 hover:bg-green-900/40'
      : 'border border-red-900 text-red-400 hover:bg-red-900/30';
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${cls}`}
    >
      {label}
    </button>
  );
}

// ============================================================
// Page
// ============================================================

export default function AdminMembersPage() {
  const [search, setSearch]           = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [members, setMembers]         = useState<AdminMember[]>(ADMIN_MEMBERS);
  const [toast, setToast]             = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (search && !m.nickname.includes(search) && !m.email.includes(search)) return false;
      if (genderFilter !== 'all' && m.gender !== genderFilter) return false;
      if (statusFilter !== 'all' && m.memberStatus !== statusFilter) return false;
      return true;
    });
  }, [members, search, genderFilter, statusFilter]);

  const updateStatus = (id: number, newStatus: MemberStatus) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, memberStatus: newStatus } : m))
    );
    const label = MEMBER_STATUS_CONFIG[newStatus].label;
    showToast(`ステータスを「${label}」に変更しました`);
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">会員管理</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            全 {ADMIN_MEMBERS.length} 名（表示 {filtered.length} 名）
          </p>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 flex flex-wrap gap-3 items-end">
        {/* 検索 */}
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ニックネーム・メールで検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
          />
        </div>
        {/* 性別 */}
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
        {/* ステータス */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1">ステータス</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={selectCls}
          >
            <option value="all">すべて</option>
            <option value="approved">承認済み</option>
            <option value="pending">審査中</option>
            <option value="suspended">停止</option>
          </select>
        </div>
        {/* リセット */}
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
          <table className="w-full text-sm min-w-[800px]">
            <thead className="border-b border-zinc-800">
              <tr>
                {['ID', '会員', '性別', '年齢', '居住地', '登録日', 'ステータス', '操作'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs text-zinc-400 font-medium uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                    該当する会員が見つかりませんでした
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-800/50 transition-colors">
                    {/* ID */}
                    <td className="px-4 py-3 text-zinc-500 text-xs font-mono">#{m.id}</td>

                    {/* 会員 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: m.avatarColor }}
                        >
                          {m.initials}
                        </div>
                        <div>
                          <p className="text-zinc-100 font-medium">{m.nickname}</p>
                          <p className="text-zinc-500 text-xs">{m.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* 性別 */}
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {m.gender === 'male' ? '男性' : '女性'}
                    </td>

                    {/* 年齢 */}
                    <td className="px-4 py-3 text-zinc-400 text-xs">{m.age}歳</td>

                    {/* 居住地 */}
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-teal-500 flex-shrink-0" />
                        {m.prefecture}
                      </span>
                    </td>

                    {/* 登録日 */}
                    <td className="px-4 py-3 text-zinc-400 text-xs">{m.registeredAt}</td>

                    {/* ステータス */}
                    <td className="px-4 py-3">
                      <StatusBadge status={m.memberStatus} />
                    </td>

                    {/* 操作 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/admin/members/${m.id}`}>
                          <ActionButton label="詳細" variant="detail" onClick={() => {}} />
                        </Link>
                        {m.memberStatus !== 'approved' && (
                          <ActionButton
                            label="承認"
                            variant="approve"
                            onClick={() => updateStatus(m.id, 'approved')}
                          />
                        )}
                        {m.memberStatus !== 'suspended' && (
                          <ActionButton
                            label="停止"
                            variant="suspend"
                            onClick={() => updateStatus(m.id, 'suspended')}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ページネーション（ダミー） */}
        <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>{filtered.length} 名 / 全 128 名（ダミーデータ {ADMIN_MEMBERS.length} 名表示中）</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, '...', 13].map((p, i) => (
              <button
                key={i}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  p === 1
                    ? 'bg-teal-900 text-teal-400 border border-teal-800'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl z-50">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
