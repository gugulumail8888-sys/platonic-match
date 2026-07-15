'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle2, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Person {
  id: string;
  nickname: string;
  avatarColor: string;
  initials: string;
  email: string;
  amount: number | null;
  paymentIntentId: string | null;
  refunded: boolean;
}

interface SecondReport {
  reportedBy: 'applicant' | 'partner' | null;
  reason: string | null;
  detail: string | null;
}

interface CancellationItem {
  id: string;
  createdAt: string;
  applicant: Person;
  partner: Person;
  cancelReason: string | null;
  cancelDetail: string | null;
  reportedBy: 'applicant' | 'partner' | null;
  secondReport: SecondReport | null;
}

type SortKey = 'createdAt' | 'applicant' | 'partner' | 'cancelReason';
type SortDirection = 'asc' | 'desc';

const SORTABLE_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'createdAt',   label: '日時' },
  { key: 'applicant',   label: '申請者' },
  { key: 'partner',     label: 'お相手' },
  { key: 'cancelReason', label: 'キャンセル理由' },
];

function getSortValue(item: CancellationItem, key: SortKey): string | number {
  switch (key) {
    case 'createdAt':    return new Date(item.createdAt).getTime();
    case 'applicant':    return item.applicant.nickname;
    case 'partner':      return item.partner.nickname;
    case 'cancelReason': return item.cancelReason ?? '';
  }
}

type StatusFilter = 'all' | 'needsAction' | 'done' | 'doubleReport';

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',          label: 'すべて' },
  { value: 'needsAction',  label: '要返金対応' },
  { value: 'done',         label: '対応済み' },
  { value: 'doubleReport', label: '2件報告あり' },
];

function needsAction(item: CancellationItem): boolean {
  const applicantNeeds = !!item.applicant.paymentIntentId && !item.applicant.refunded;
  const partnerNeeds   = !!item.partner.paymentIntentId && !item.partner.refunded;
  return applicantNeeds || partnerNeeds;
}

const PAGE_SIZE = 10;

function MemberChip({ nickname, avatarColor, initials, email }: { nickname: string; avatarColor: string; initials: string; email?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: avatarColor }}
      >
        {initials}
      </div>
      <div className="flex flex-col">
        <span className="text-zinc-200 text-sm">{nickname}</span>
        {email && <span className="text-zinc-500 text-xs">{email}</span>}
      </div>
    </div>
  );
}

function RefundCell({ person, onRefund, disabled }: { person: Person; onRefund: () => void; disabled: boolean }) {
  if (!person.paymentIntentId) {
    return <span className="text-zinc-600 text-xs whitespace-nowrap">未入金</span>;
  }
  if (person.refunded) {
    return (
      <span className="flex items-center gap-1 text-xs text-teal-400 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5" />
        返金済み（¥{person.amount?.toLocaleString() ?? '?'}）
      </span>
    );
  }
  return (
    <button
      onClick={onRefund}
      disabled={disabled}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-teal-800 text-teal-400 hover:bg-teal-950/50 transition-all disabled:opacity-50 whitespace-nowrap"
    >
      <RefreshCw className="w-3 h-3" />
      ¥{person.amount?.toLocaleString() ?? '?'} を返金
    </button>
  );
}

export default function AdminCancellationsPage() {
  const [items, setItems] = useState<CancellationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  async function fetchItems() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/cancellations');
      if (!res.ok) throw new Error('取得失敗');
      const data = await res.json();
      setItems(data);
    } catch {
      setError('キャンセルデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const counts: Record<StatusFilter, number> = {
    all:          items.length,
    needsAction:  items.filter(needsAction).length,
    done:         items.filter((i) => !needsAction(i)).length,
    doubleReport: items.filter((i) => i.secondReport !== null).length,
  };

  const filtered = items.filter((item) => {
    switch (statusFilter) {
      case 'needsAction':  return needsAction(item);
      case 'done':         return !needsAction(item);
      case 'doubleReport': return item.secondReport !== null;
      default:              return true;
    }
  });

  const sortedItems = (() => {
    if (!sortKey) return filtered;
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  })();

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = sortedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleRefund(item: CancellationItem, side: 'applicant' | 'partner') {
    const person = side === 'applicant' ? item.applicant : item.partner;
    const other  = side === 'applicant' ? item.partner : item.applicant;
    if (!person.paymentIntentId) {
      alert('決済情報が見つかりません（未入金の可能性があります）');
      return;
    }
    if (!confirm(`${person.nickname} さんへ返金しますか？（返金完了メールが自動送信されます）`)) return;

    setRefunding(item.id + side);
    try {
      const res = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matching_id: item.id,
          refund_to_user_id: person.id,
          cancelled_by_user_id: other.id,
          stripe_payment_intent_id: person.paymentIntentId,
          reason: `キャンセル報告による返金（理由：${item.cancelReason ?? '未記入'}）`,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      if (result.emailSent) {
        alert('返金が完了しました(返金先の会員へ案内メールを送信しました)');
      } else {
        alert('返金処理自体は完了しましたが、案内メールの送信に失敗した可能性があります。会員へは別途手動でご連絡ください。');
      }
      fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : '返金に失敗しました');
    } finally {
      setRefunding(null);
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          キャンセル・返金管理
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          会員からのキャンセル報告一覧です。内容を確認のうえ、返金が必要な場合は該当する側の返金ボタンから手動で処理してください。申請者・お相手はそれぞれ別に支払っているため、返金も個別に行います。
        </p>
      </div>

      {/* ステータス別絞り込みボタン */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = statusFilter === opt.value;
          const count = counts[opt.value];
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

      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
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
                <th className="text-left px-4 py-3 text-xs text-zinc-400 font-medium uppercase tracking-wider">詳細</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-400 font-medium uppercase tracking-wider">申請者の返金</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-400 font-medium uppercase tracking-wider">お相手の返金</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">読み込み中...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-red-400">{error}</td>
                </tr>
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">キャンセル報告はありません</td>
                </tr>
              ) : (
                pagedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/50 transition-colors align-top">
                    <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                    </td>
                    <td className="px-4 py-3">
                      <MemberChip nickname={item.applicant.nickname} avatarColor={item.applicant.avatarColor} initials={item.applicant.initials} email={item.applicant.email} />
                      {item.reportedBy === 'applicant' && (
                        <span className="inline-block mt-1 text-[10px] bg-red-900/50 text-red-300 border border-red-800 px-1.5 py-0.5 rounded-full">
                          📩 報告者
                        </span>
                      )}
                      {item.secondReport?.reportedBy === 'applicant' && (
                        <span className="inline-block mt-1 text-[10px] bg-amber-900/50 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded-full">
                          📩 追加報告者
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <MemberChip nickname={item.partner.nickname} avatarColor={item.partner.avatarColor} initials={item.partner.initials} email={item.partner.email} />
                      {item.reportedBy === 'partner' && (
                        <span className="inline-block mt-1 text-[10px] bg-red-900/50 text-red-300 border border-red-800 px-1.5 py-0.5 rounded-full">
                          📩 報告者
                        </span>
                      )}
                      {item.secondReport?.reportedBy === 'partner' && (
                        <span className="inline-block mt-1 text-[10px] bg-amber-900/50 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded-full">
                          📩 追加報告者
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-200 max-w-[180px]">
                      <div>{item.cancelReason ?? '（未記入）'}</div>
                      {item.secondReport && (
                        <div className="mt-2 pt-2 border-t border-zinc-700 text-zinc-400">
                          <span className="text-[10px] text-zinc-500">
                            {item.secondReport.reportedBy === 'applicant' ? item.applicant.nickname : item.secondReport.reportedBy === 'partner' ? item.partner.nickname : '相手'}からの追加報告：
                          </span>
                          <div>{item.secondReport.reason ?? '（未記入）'}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs max-w-[220px] whitespace-pre-wrap">
                      <div>{item.cancelDetail ?? '-'}</div>
                      {item.secondReport?.detail && (
                        <div className="mt-2 pt-2 border-t border-zinc-700">{item.secondReport.detail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <RefundCell person={item.applicant} onRefund={() => handleRefund(item, 'applicant')} disabled={refunding !== null} />
                    </td>
                    <td className="px-4 py-3">
                      <RefundCell person={item.partner} onRefund={() => handleRefund(item, 'partner')} disabled={refunding !== null} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        {!loading && !error && sortedItems.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">
              全{sortedItems.length}件中 {(currentPage - 1) * PAGE_SIZE + 1}〜{Math.min(currentPage * PAGE_SIZE, sortedItems.length)}件を表示
            </span>
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
          </div>
        )}
      </div>
    </div>
  );
}
