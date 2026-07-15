'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Video, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// ============================================================
// Types
// ============================================================

type ScheduleStatus = 'scheduling' | 'confirmed' | 'zoom_sent';

interface ScheduleItem {
  id: string;
  applicant: { nickname: string; avatarColor: string; initials: string; email: string };
  target:    { nickname: string; avatarColor: string; initials: string; email: string };
  scheduledAt: string | null;
  status: ScheduleStatus;
  zoomSent: boolean;
  refunded: boolean;
  paymentIntentId: string | null;
  amount: number | null;
  partnerRefunded: boolean;
  partnerPaymentIntentId: string | null;
  partnerAmount: number | null;
  applicantUserId: string;
  partnerUserId: string;
}

const STATUS_CONFIG: Record<ScheduleStatus, { label: string; className: string; icon: React.ElementType }> = {
  scheduling: { label: '日程調整中', className: 'bg-blue-900/50 text-blue-300 border border-blue-800',   icon: Clock },
  confirmed:  { label: '確定済み',   className: 'bg-green-900/50 text-green-300 border border-green-800', icon: CheckCircle2 },
  zoom_sent:  { label: 'Google Meet送信済', className: 'bg-teal-900/50 text-teal-300 border border-teal-800',   icon: Video },
};

// ============================================================
// Sub-components
// ============================================================

function StatusBadge({ status }: { status: ScheduleStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

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

// ============================================================
// Page
// ============================================================

type FilterTab = 'all' | ScheduleStatus;

const FILTER_OPTIONS: { value: FilterTab; label: string }[] = [
  { value: 'all',        label: 'すべて' },
  { value: 'scheduling', label: '日程調整中' },
  { value: 'confirmed',  label: '確定済み' },
  { value: 'zoom_sent',  label: 'Google Meet送信済' },
];

const PAGE_SIZE = 10;

export default function AdminSchedulePage() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchSchedules();
  }, []);

  async function fetchSchedules() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/schedules');
      if (!res.ok) throw new Error('取得失敗');
      const data = await res.json();
      setSchedules(data);
    } catch {
      setError('日程データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefund(item: ScheduleItem, side: 'applicant' | 'partner') {
    const paymentIntentId = side === 'applicant' ? item.paymentIntentId : item.partnerPaymentIntentId;
    const refundToNickname = side === 'applicant' ? item.applicant.nickname : item.target.nickname;
    const refundToUserId = side === 'applicant' ? item.applicantUserId : item.partnerUserId;
    const cancelledByUserId = side === 'applicant' ? item.partnerUserId : item.applicantUserId;

    if (!paymentIntentId) {
      alert('決済情報が見つかりません');
      return;
    }
    if (!confirm(`${refundToNickname} さんへ返金しますか？（返金完了メールが自動送信されます）`)) return;

    setRefunding(`${item.id}-${side}`);
    try {
      const res = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matching_id: item.id,
          refund_to_user_id: refundToUserId,
          cancelled_by_user_id: cancelledByUserId,
          stripe_payment_intent_id: paymentIntentId,
          reason: 'ドタキャンによる返金',
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      if (result.emailSent) {
        alert('返金が完了しました（返金先の会員へ案内メールを送信しました）');
      } else {
        alert('返金処理自体は完了しましたが、案内メールの送信に失敗した可能性があります。会員へは別途手動でご連絡ください。');
      }
      fetchSchedules();
    } catch (err) {
      alert(err instanceof Error ? err.message : '返金に失敗しました');
    } finally {
      setRefunding(null);
    }
  }

  const filtered = schedules.filter((s) =>
    filter === 'all' ? true : s.status === filter
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFilterChange = (value: FilterTab) => {
    setFilter(value);
    setPage(1);
  };

  const counts = {
    all:        schedules.length,
    scheduling: schedules.filter((s) => s.status === 'scheduling').length,
    confirmed:  schedules.filter((s) => s.status === 'confirmed').length,
    zoom_sent:  schedules.filter((s) => s.status === 'zoom_sent').length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">日程管理</h1>
          <p className="text-sm text-zinc-400 mt-0.5">全 {schedules.length} 件</p>
        </div>
        <button onClick={fetchSchedules} className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* エラー */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800 rounded-xl p-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* フィルタータブ */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleFilterChange(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-950 text-teal-400 border border-teal-900'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {opt.label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-teal-900 text-teal-300' : 'bg-zinc-700 text-zinc-400'
              }`}>
                {counts[opt.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* カード一覧 */}
      {loading ? (
        <div className="text-center py-16 text-zinc-500">読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">該当する日程がありません</div>
      ) : (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                <th className="text-left p-4">申請者</th>
                <th className="text-left p-4">お相手</th>
                <th className="text-left p-4">ステータス</th>
                <th className="text-left p-4">確定日時</th>
                <th className="text-left p-4">Google Meet</th>
                <th className="text-left p-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-zinc-800 hover:bg-zinc-800 transition-all"
                >
                  <td className="p-4"><MemberChip {...item.applicant} /></td>
                  <td className="p-4"><MemberChip {...item.target} /></td>
                  <td className="p-4"><StatusBadge status={item.status} /></td>
                  <td className="p-4">
                    <span className={item.scheduledAt ? 'text-zinc-200 font-medium' : 'text-zinc-600'}>
                      {item.scheduledAt ?? '未確定'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={item.status === 'zoom_sent' ? 'text-green-400' : 'text-zinc-500'}>
                      {item.status === 'zoom_sent' ? '送信済' : '未送信'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2 min-w-[160px]">
                      {/* 返金ボタン（申請者側） */}
                      {item.paymentIntentId && !item.refunded && (
                        <button
                          onClick={() => handleRefund(item, 'applicant')}
                          disabled={refunding === `${item.id}-applicant`}
                          className="w-full py-2 rounded-xl text-sm font-medium border border-red-800 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {refunding === `${item.id}-applicant` ? '返金処理中...' : '⚠ 申請者へ返金する'}
                        </button>
                      )}
                      {item.paymentIntentId && item.refunded && (
                        <div className="w-full py-2 rounded-xl text-sm font-medium text-center bg-zinc-800 text-zinc-500">
                          申請者へ返金済み
                        </div>
                      )}

                      {/* 返金ボタン（お相手側） */}
                      {item.partnerPaymentIntentId && !item.partnerRefunded && (
                        <button
                          onClick={() => handleRefund(item, 'partner')}
                          disabled={refunding === `${item.id}-partner`}
                          className="w-full py-2 rounded-xl text-sm font-medium border border-red-800 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {refunding === `${item.id}-partner` ? '返金処理中...' : '⚠ お相手へ返金する'}
                        </button>
                      )}
                      {item.partnerPaymentIntentId && item.partnerRefunded && (
                        <div className="w-full py-2 rounded-xl text-sm font-medium text-center bg-zinc-800 text-zinc-500">
                          お相手へ返金済み
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">
              全{filtered.length}件中 {(currentPage - 1) * PAGE_SIZE + 1}〜{Math.min(currentPage * PAGE_SIZE, filtered.length)}件を表示
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
        </div>
      )}
    </div>
  );
}
