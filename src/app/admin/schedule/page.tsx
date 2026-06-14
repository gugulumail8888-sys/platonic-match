'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, CheckCircle2, Video, RefreshCw, AlertCircle } from 'lucide-react';

// ============================================================
// Types
// ============================================================

type ScheduleStatus = 'scheduling' | 'confirmed' | 'zoom_sent';

interface ScheduleItem {
  id: string;
  applicant: { nickname: string; avatarColor: string; initials: string };
  target:    { nickname: string; avatarColor: string; initials: string };
  scheduledAt: string | null;
  status: ScheduleStatus;
  zoomSent: boolean;
  refunded: boolean;
  paymentIntentId: string | null;
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

function MemberChip({ nickname, avatarColor, initials }: { nickname: string; avatarColor: string; initials: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: avatarColor }}
      >
        {initials}
      </div>
      <span className="text-zinc-200 text-sm">{nickname}</span>
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

export default function AdminSchedulePage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function handleRefund(item: ScheduleItem) {
    if (!item.paymentIntentId) {
      alert('決済情報が見つかりません');
      return;
    }
    if (!confirm(`${item.applicant.nickname} さんへ返金しますか？`)) return;

    setRefunding(item.id);
    try {
      const res = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matching_id: item.id,
          refund_to_user_id: item.applicantUserId,
          cancelled_by_user_id: item.partnerUserId,
          stripe_payment_intent_id: item.paymentIntentId,
          reason: 'ドタキャンによる返金',
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      alert('返金が完了しました');
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
              onClick={() => setFilter(opt.value)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 hover:border-zinc-700 transition-all"
            >
              {/* ステータス */}
              <div className="flex items-center justify-between mb-4">

                <StatusBadge status={item.status} />
              </div>

              {/* 両者のニックネーム */}
              <div className="bg-zinc-800 rounded-xl p-3 mb-4 space-y-2">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>申請者</span>
                  <span>お相手</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <MemberChip {...item.applicant} />
                  <span className="text-zinc-600 text-xs flex-shrink-0">↔</span>
                  <MemberChip {...item.target} />
                </div>
              </div>

              {/* 日時・ZOOM */}
              <div className="mb-4 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />確定日時
                  </span>
                  <span className={item.scheduledAt ? 'text-zinc-200 font-medium' : 'text-zinc-600'}>
                    {item.scheduledAt ?? '未確定'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Video className="w-3 h-3" />Google Meetリンク
                  </span>
                  <span className={item.status === 'zoom_sent' ? 'text-green-400' : 'text-zinc-500'}>
                    {item.status === 'zoom_sent' ? '送信済' : '未送信'}
                  </span>
                </div>
              </div>

              {/* ボタンエリア */}
              <div className="space-y-2">
                {/* Google Meetリンク送信ボタン */}
                <button
                  onClick={() => router.push(`/admin/schedule/${item.id}`)}
                  disabled={item.status === 'scheduling'}
                  className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                    item.status === 'zoom_sent'
                      ? 'border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      : item.status !== 'scheduling'
                      ? 'bg-teal-700 text-white hover:bg-teal-600'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  {item.status === 'zoom_sent' ? '詳細を見る' : item.status !== 'scheduling' ? 'Google Meetリンクを送る' : '日程未確定'}
                </button>

                {/* 返金ボタン */}
                {item.paymentIntentId && !item.refunded && (
                  <button
                    onClick={() => handleRefund(item)}
                    disabled={refunding === item.id}
                    className="w-full py-2 rounded-xl text-sm font-medium border border-red-800 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {refunding === item.id ? '返金処理中...' : '⚠ 返金する'}
                  </button>
                )}
                {item.refunded && (
                  <div className="w-full py-2 rounded-xl text-sm font-medium text-center bg-zinc-800 text-zinc-500">
                    返金済み
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
