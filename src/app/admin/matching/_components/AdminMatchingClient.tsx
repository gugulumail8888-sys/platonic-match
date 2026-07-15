'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MapPin, X, ChevronRight, ChevronLeft, CheckCircle2, Circle, ArrowUp, ArrowDown } from 'lucide-react';

// ── 型定義 ────────────────────────────────────────────────────

export type AppStatus = 'pending' | 'scheduling' | 'completed' | 'zoom_completed' | 'cancelled' | 'rejected' | 'ended';

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
  scheduled_at: string | null;
  meeting_ended_at: string | null;
  user1_joined_at: string | null;
  user2_joined_at: string | null;
  applicant_consented: boolean;
  partner_consented: boolean;
  reject_reason: string | null;
  amount: number | null;
  partner_amount: number | null;
  payment_intent_id: string | null;
  partner_payment_intent_id: string | null;
  refunded: boolean;
  partner_refunded: boolean;
}

// ── 定数 ──────────────────────────────────────────────────────

export const APP_STATUS_CONFIG: Record<AppStatus, { label: string; className: string }> = {
  pending:        { label: '申請中',     className: 'bg-amber-900/50 text-amber-300 border border-amber-800' },
  scheduling:     { label: '日程調整中', className: 'bg-blue-900/50  text-blue-300  border border-blue-800'  },
  completed:      { label: '完了',       className: 'bg-green-900/50 text-green-300 border border-green-800' },
  zoom_completed: { label: 'Google Meet送信済',   className: 'bg-blue-900    text-blue-300'                           },
  cancelled:      { label: 'キャンセル', className: 'bg-red-900/50 text-red-300 border border-red-800' },
  rejected:       { label: '拒否',       className: 'bg-zinc-700 text-zinc-400 border border-zinc-600' },
  ended:          { label: '終了済み',   className: 'bg-zinc-800 text-zinc-400 border border-zinc-700' },
};

const NEXT_STATUS: Partial<Record<AppStatus, AppStatus>> = {
  pending:    'scheduling',
  scheduling: 'zoom_completed',
  zoom_completed: 'completed',
};

const NEXT_LABEL: Partial<Record<AppStatus, string>> = {
  pending:        '日程調整中に進める →',
  scheduling:     'Google Meet送信済にする →',
  zoom_completed: '完了にする →',
};

type StatusFilter = 'all' | AppStatus;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',            label: 'すべて' },
  { value: 'pending',        label: '申請中' },
  { value: 'scheduling',     label: '日程調整中' },
  { value: 'zoom_completed', label: 'Google Meet送信済' },
  { value: 'completed',      label: '完了' },
  { value: 'cancelled',      label: 'キャンセル' },
  { value: 'rejected',       label: '拒否' },
  { value: 'ended',          label: '終了済み' },
];

const PAGE_SIZE = 10;

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

type SortKey = 'id' | 'applicant' | 'partner' | 'created_at' | 'status' | 'joined' | 'overtime';
type SortDirection = 'asc' | 'desc';

const SORTABLE_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'id',         label: '申請番号'   },
  { key: 'applicant',  label: '申請者'     },
  { key: 'partner',    label: 'お相手'     },
  { key: 'created_at', label: '申請日'     },
  { key: 'status',     label: 'ステータス' },
  { key: 'joined',     label: '入室状況'   },
  { key: 'overtime',   label: '時間超過'   },
];

// 時間超過バッジの表示条件（352行目付近の判定と同一。ソート用に複製）
function isOvertime(row: MatchingRow, now: number): boolean {
  return (
    row.status === 'zoom_completed' &&
    row.scheduled_at !== null &&
    row.meeting_ended_at === null &&
    now - new Date(row.scheduled_at).getTime() >= 50 * 60 * 1000
  );
}

function joinedCount(row: MatchingRow): number {
  return (row.user1_joined_at !== null ? 1 : 0) + (row.user2_joined_at !== null ? 1 : 0);
}

function getSortValue(row: MatchingRow, key: SortKey, now: number): string | number | boolean {
  switch (key) {
    case 'id':         return row.id;
    case 'applicant':  return row.applicant?.nickname ?? '';
    case 'partner':    return row.partner?.nickname ?? '';
    case 'created_at': return new Date(row.created_at).getTime();
    case 'status':     return row.status;
    case 'joined':     return joinedCount(row);
    case 'overtime':   return isOvertime(row, now);
  }
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
              <span className="text-zinc-500">料金（申請者）</span>
              <span className="text-zinc-200">
                {row.amount != null ? `¥${row.amount.toLocaleString()}` : '未確定'}
                {row.refunded ? '（返金済み）' : row.payment_intent_id ? '（支払い済み）' : '（未払い）'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">料金（お相手）</span>
              <span className="text-zinc-200">
                {row.partner_amount != null ? `¥${row.partner_amount.toLocaleString()}` : '未確定'}
                {row.partner_refunded ? '（返金済み）' : row.partner_payment_intent_id ? '（支払い済み）' : '（未払い）'}
              </span>
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
  const [sortKey, setSortKey]           = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);

  const now = Date.now();

  const filtered = matchings.filter((r) =>
    statusFilter === 'all' ? true : r.status === statusFilter
  );

  const handleFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

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
      const va = getSortValue(a, sortKey, now);
      const vb = getSortValue(b, sortKey, now);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [filtered, sortKey, sortDirection, now]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const counts: Record<StatusFilter, number> = {
    all:            matchings.length,
    pending:        matchings.filter((r) => r.status === 'pending').length,
    scheduling:     matchings.filter((r) => r.status === 'scheduling').length,
    zoom_completed: matchings.filter((r) => r.status === 'zoom_completed').length,
    completed:      matchings.filter((r) => r.status === 'completed').length,
    cancelled:      matchings.filter((r) => r.status === 'cancelled').length,
    rejected:       matchings.filter((r) => r.status === 'rejected').length,
    ended:          matchings.filter((r) => r.status === 'ended').length,
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
              onClick={() => handleFilterChange(opt.value)}
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
                <th className="text-left px-4 py-3 text-xs text-zinc-400 font-med uppercase tracking-wider">
                  同意状況
                </th>
                <th className="text-left px-4 py-3 text-xs text-zinc-400 font-medium uppercase tracking-wider">
                  操作
                </th>
                <th className="text-left px-4 py-3 text-xs text-zinc-400 font-medium uppercase tracking-wider">
                  お断り理由
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-zinc-500">
                    該当する申請が見つかりませんでした
                  </td>
                </tr>
              ) : (
                paged.map((row) => {
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

                      {/* 入室状況 */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-zinc-500 w-10 flex-shrink-0">申請者</span>
                            {row.user1_joined_at !== null ? (
                              <span className="flex items-center gap-1 text-green-400">
                                <CheckCircle2 className="w-3 h-3" />
                                入室済み
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-zinc-600">
                                <Circle className="w-3 h-3" />
                                未入室
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-zinc-500 w-10 flex-shrink-0">お相手</span>
                            {row.user2_joined_at !== null ? (
                              <span className="flex items-center gap-1 text-green-400">
                                <CheckCircle2 className="w-3 h-3" />
                                入室済み
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-zinc-600">
                                <Circle className="w-3 h-3" />
                                未入室
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 同意状況 */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-zinc-500 w-10 flex-shrink-0">申請者</span>
                            {row.applicant_consented ? (
                              <span className="flex items-center gap-1 text-green-400">
                                <CheckCircle2 className="w-3 h-3" />
                                同意済み
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-zinc-600">
                                <Circle className="w-3 h-3" />
                                未同意
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-zinc-500 w-10 flex-shrink-0">お相手</span>
                            {row.partner_consented ? (
                              <span className="flex items-center gap-1 text-green-400">
                                <CheckCircle2 className="w-3 h-3" />
                                同意済み
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-zinc-600">
                                <Circle className="w-3 h-3" />
                                未同意
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 時間超過 */}
                      <td className="px-4 py-3">
                        {row.status === 'zoom_completed' &&
                          row.scheduled_at !== null &&
                          row.meeting_ended_at === null &&
                          now - new Date(row.scheduled_at).getTime() >= 50 * 60 * 1000 && (
                            <span className="text-xs font-medium text-red-400">⚠️ 超過</span>
                          )}
                      </td>

                      {/* 操作 */}
                      <td className="px-4 py-3 w-48">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedRow(row)}
                            className="text-xs w-8 py-1 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-center"
                          >
                            詳細
                          </button>
                          {nextStatus && nextLabel && (
                            <form action={updateStatus}>
                              <input type="hidden" name="id" value={row.id} />
                              <input type="hidden" name="status" value={nextStatus} />
                              <button
                                type="submit"
                                className="text-xs px-2.5 py-1 rounded-lg border border-teal-800 text-teal-400 hover:bg-teal-900/40 transition-colors whitespace-nowrap"
                              >
                                {nextLabel.replace(' →', '')}
                              </button>
                            </form>
                          )}
                        </div>
                      </td>

                      {/* お断り理由 */}
                      <td className="px-4 py-3 text-xs text-zinc-400 max-w-[200px]">
                        {row.status === 'rejected' && row.reject_reason ? (
                          <span className="text-zinc-300">{row.reject_reason}</span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
          <span className="text-xs text-zinc-500">
            全{sorted.length}件中 {(currentPage - 1) * PAGE_SIZE + 1}〜{Math.min(currentPage * PAGE_SIZE, sorted.length)}件を表示
          </span>
          {sorted.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                前へ
              </button>
              <span className="text-xs text-zinc-400">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
              >
                次へ
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
