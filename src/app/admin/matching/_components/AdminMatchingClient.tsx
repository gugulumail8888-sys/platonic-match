'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, X, ChevronRight } from 'lucide-react';

// ── 型定義 ────────────────────────────────────────────────────

export type AppStatus = 'pending' | 'scheduling' | 'completed' | 'zoom_completed' | 'cancelled' | 'rejected';

export interface MatchingProfile {
  id: string;
  nickname: string;
  birth_date: string;
  prefecture: string;
  occupation: string;
  avatar_url: string | null;
}

export interface MatchingRow {
  id: string;
  status: AppStatus;
  created_at: string;
  applicant_id: string;
  partner_id: string;
  applicant_dating_wish: boolean;
  partner_dating_wish: boolean;
  applicant: MatchingProfile | null;
  partner: MatchingProfile | null;
}

// ── 定数 ──────────────────────────────────────────────────────

export const APP_STATUS_CONFIG: Record<AppStatus, { label: string; className: string }> = {
  pending:        { label: '申請中',     className: 'bg-amber-900/50 text-amber-300 border border-amber-800' },
  scheduling:     { label: '日程調整中', className: 'bg-blue-900/50  text-blue-300  border border-blue-800'  },
  completed:      { label: '完了',       className: 'bg-green-900/50 text-green-300 border border-green-800' },
  zoom_completed: { label: 'Google Meet完了',   className: 'bg-blue-900    text-blue-300'                           },
  cancelled:      { label: 'キャンセル', className: 'bg-red-900/50 text-red-300 border border-red-800' },
  rejected:       { label: '拒否',       className: 'bg-zinc-700 text-zinc-400 border border-zinc-600' },
};

const NEXT_STATUS: Partial<Record<AppStatus, AppStatus>> = {
  pending:    'scheduling',
  scheduling: 'zoom_completed',
  zoom_completed: 'completed',
};

const NEXT_LABEL: Partial<Record<AppStatus, string>> = {
  pending:        '日程調整中に進める →',
  scheduling:     'Google Meet完了にする →',
  zoom_completed: '完了にする →',
};

type StatusFilter = 'all' | AppStatus;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',            label: 'すべて' },
  { value: 'pending',        label: '申請中' },
  { value: 'scheduling',     label: '日程調整中' },
  { value: 'zoom_completed', label: 'Google Meet完了' },
  { value: 'completed',      label: '完了' },
  { value: 'cancelled',      label: 'キャンセル' },
  { value: 'rejected',       label: '拒否' },
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

// ── サブコンポーネント ─────────────────────────────────────────

function StatusBadge({ status }: { status: AppStatus }) {
  const cfg = APP_STATUS_CONFIG[status];
  if (!cfg) return <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-zinc-700 text-zinc-300">{status}</span>;
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function MemberChip({ profile }: { profile: MatchingProfile | null }) {
  if (!profile) return <span className="text-zinc-600 text-xs">不明</span>;
  return (
    <div className="flex items-center gap-2">
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt={profile.nickname} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-teal-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {profile.nickname.charAt(0)}
        </div>
      )}
      <div>
        <p className="text-zinc-100 text-sm font-medium">{profile.nickname}</p>
        <p className="text-zinc-500 text-xs flex items-center gap-1">
          {calcAge(profile.birth_date)}歳
          <span>·</span>
          <MapPin className="w-2.5 h-2.5 text-teal-500" />
          {profile.prefecture}
        </p>
      </div>
    </div>
  );
}

// ── 詳細モーダル ──────────────────────────────────────────────

function DetailModal({
  row,
  onClose,
  updateStatus,
}: {
  row: MatchingRow;
  onClose: () => void;
  updateStatus: (formData: FormData) => Promise<void>;
}) {
  const nextStatus = NEXT_STATUS[row.status] ?? null;
  const nextLabel  = NEXT_LABEL[row.status]  ?? null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white font-mono">{row.id.slice(0, 8).toUpperCase()}</h2>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <StatusBadge status={row.status} />
              {(row.applicant_dating_wish || row.partner_dating_wish) && (
                <span className="text-xs bg-pink-900/50 text-pink-300 border border-pink-800 px-2 py-0.5 rounded-full">
                  💑 交際希望あり
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 申請者・お相手 */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">申請者 → お相手</p>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-zinc-800 rounded-xl p-4">
                <p className="text-[10px] text-zinc-500 mb-2">申請者</p>
                <MemberChip profile={row.applicant} />
                {row.applicant && (
                  <div className="mt-2 text-xs">
                    <Link href={`/admin/members/${row.applicant.id}`} className="text-teal-400 hover:text-teal-300 flex items-center gap-0.5 transition-colors">
                      詳細を見る <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
                {row.applicant_dating_wish && (
                  <p className="text-xs text-pink-400 mt-2">💑 交際希望を送信済み</p>
                )}
              </div>
              <div className="bg-zinc-800 rounded-xl p-4">
                <p className="text-[10px] text-zinc-500 mb-2">お相手</p>
                <MemberChip profile={row.partner} />
                {row.partner && (
                  <div className="mt-2 text-xs">
                    <Link href={`/admin/members/${row.partner.id}`} className="text-teal-400 hover:text-teal-300 flex items-center gap-0.5 transition-colors">
                      詳細を見る <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
                {row.partner_dating_wish && (
                  <p className="text-xs text-pink-400 mt-2">💑 交際希望を送信済み</p>
                )}
              </div>
            </div>
          </div>

          {/* 申請詳細 */}
          <div className="text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">申請日</span>
              <span className="text-zinc-200">{new Date(row.created_at).toLocaleDateString('ja-JP')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">料金</span>
              <span className="text-zinc-200">無料プラン ¥3,500・AIおすすめプラン ¥3,000（税込）</span>
            </div>
          </div>

          {/* ステータス変更 */}
          {nextStatus && nextLabel && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">ステータス変更</p>
              <form action={updateStatus}>
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="status" value={nextStatus} />
                <button
                  type="submit"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-teal-700 text-white text-sm font-medium hover:bg-teal-600 transition-colors"
                >
                  {nextLabel}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── メインコンポーネント ───────────────────────────────────────

export default function AdminMatchingClient({
  matchings,
  updateStatus,
}: {
  matchings: MatchingRow[];
  updateStatus: (formData: FormData) => Promise<void>;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedRow, setSelectedRow]   = useState<MatchingRow | null>(null);

  const filtered = matchings.filter((r) =>
    statusFilter === 'all' ? true : r.status === statusFilter
  );

  const counts: Record<StatusFilter, number> = {
    all:            matchings.length,
    pending:        matchings.filter((r) => r.status === 'pending').length,
    scheduling:     matchings.filter((r) => r.status === 'scheduling').length,
    zoom_completed: matchings.filter((r) => r.status === 'zoom_completed').length,
    completed:      matchings.filter((r) => r.status === 'completed').length,
    cancelled:      matchings.filter((r) => r.status === 'cancelled').length,
    rejected:       matchings.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-white">お見合い申請管理</h1>
        <p className="text-sm text-zinc-400 mt-0.5">全 {matchings.length} 件</p>
      </div>

      {/* フィルタータブ */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = statusFilter === opt.value;
          const count    = counts[opt.value];
          return (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-950 text-teal-400 border border-teal-900'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {opt.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-teal-900 text-teal-300' : 'bg-zinc-700 text-zinc-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* テーブル */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="border-b border-zinc-800">
              <tr>
                {['申請番号', '申請者', 'お相手', '申請日', 'ステータス', '操作'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-zinc-400 font-medium uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    該当する申請が見つかりませんでした
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const hasDatingWish = row.applicant_dating_wish || row.partner_dating_wish;
                  const nextStatus = NEXT_STATUS[row.status] ?? null;
                  const nextLabel  = NEXT_LABEL[row.status]  ?? null;

                  return (
                    <tr key={row.id} className="hover:bg-zinc-800/50 transition-colors">
                      {/* 申請番号 */}
                      <td className="px-4 py-3 font-mono text-zinc-400 text-xs">
                        <div>{row.id.slice(0, 8).toUpperCase()}</div>
                        {hasDatingWish && (
                          <span className="inline-block mt-1 text-[10px] bg-pink-900/50 text-pink-300 border border-pink-800 px-1.5 py-0.5 rounded-full">
                            💑 交際希望あり
                          </span>
                        )}
                      </td>

                      {/* 申請者 */}
                      <td className="px-4 py-3">
                        <MemberChip profile={row.applicant} />
                      </td>

                      {/* お相手 */}
                      <td className="px-4 py-3">
                        <MemberChip profile={row.partner} />
                      </td>

                      {/* 申請日 */}
                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        {new Date(row.created_at).toLocaleDateString('ja-JP')}
                      </td>

                      {/* ステータス */}
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>

                      {/* 操作 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedRow(row)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                          >
                            詳細
                          </button>
                          {nextStatus && nextLabel && (
                            <form action={updateStatus}>
                              <input type="hidden" name="id" value={row.id} />
                              <input type="hidden" name="status" value={nextStatus} />
                              <button
                                type="submit"
                                className="text-xs px-2.5 py-1 rounded-lg border border-teal-800 text-teal-400 hover:bg-teal-900/40 transition-colors"
                              >
                                {nextLabel.replace(' →', '')}
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-zinc-800 text-xs text-zinc-500">
          {filtered.length} 件表示 / 全 {matchings.length} 件
        </div>
      </div>

      {/* 詳細モーダル */}
      {selectedRow && (
        <DetailModal
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
          updateStatus={updateStatus}
        />
      )}
    </div>
  );
}
