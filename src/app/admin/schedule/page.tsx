'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Clock, CheckCircle2, Video } from 'lucide-react';

// ============================================================
// Types & Data
// ============================================================

type ScheduleStatus = 'scheduling' | 'confirmed';

interface ScheduleItem {
  id: string;
  applicationId: string;
  applicant: { nickname: string; avatarColor: string; initials: string };
  target:    { nickname: string; avatarColor: string; initials: string };
  scheduledAt: string | null;
  status: ScheduleStatus;
  zoomSent: boolean;
}

const STATUS_CONFIG: Record<ScheduleStatus, { label: string; className: string; icon: React.ElementType }> = {
  scheduling: { label: '日程調整中', className: 'bg-blue-900/50 text-blue-300 border border-blue-800',   icon: Clock },
  confirmed:  { label: '確定済み',   className: 'bg-green-900/50 text-green-300 border border-green-800', icon: CheckCircle2 },
};

const DUMMY_SCHEDULES: ScheduleItem[] = [
  {
    id: 'SCH-001',
    applicationId: 'APP-523',
    applicant: { nickname: 'さくら',  avatarColor: '#e879a0', initials: 'さ' },
    target:    { nickname: 'たける',  avatarColor: '#2563eb', initials: 'た' },
    scheduledAt: '2026年6月15日（日）14:00',
    status: 'confirmed',
    zoomSent: false,
  },
  {
    id: 'SCH-002',
    applicationId: 'APP-847',
    applicant: { nickname: 'みらい',  avatarColor: '#7c3aed', initials: 'み' },
    target:    { nickname: 'けんじ',  avatarColor: '#0d9488', initials: 'け' },
    scheduledAt: null,
    status: 'scheduling',
    zoomSent: false,
  },
  {
    id: 'SCH-003',
    applicationId: 'APP-291',
    applicant: { nickname: 'あかね',  avatarColor: '#dc2626', initials: 'あ' },
    target:    { nickname: 'りょうた', avatarColor: '#059669', initials: 'り' },
    scheduledAt: '2026年6月20日（金）19:00',
    status: 'confirmed',
    zoomSent: true,
  },
];

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
];

export default function AdminScheduleListPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = DUMMY_SCHEDULES.filter((s) =>
    filter === 'all' ? true : s.status === filter
  );

  const counts = {
    all:        DUMMY_SCHEDULES.length,
    scheduling: DUMMY_SCHEDULES.filter((s) => s.status === 'scheduling').length,
    confirmed:  DUMMY_SCHEDULES.filter((s) => s.status === 'confirmed').length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-white">日程管理</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          全 {DUMMY_SCHEDULES.length} 件（ダミーデータ）
        </p>
      </div>

      {/* フィルタータブ */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-950 text-teal-400 border border-teal-900'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {opt.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-teal-900 text-teal-300' : 'bg-zinc-700 text-zinc-400'
              }`}>
                {counts[opt.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* カード一覧 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">該当する日程が見つかりませんでした</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 hover:border-zinc-700 transition-all"
            >
              {/* 申請番号 + ステータス */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-500 font-mono">{item.applicationId}</span>
                <StatusBadge status={item.status} />
              </div>

              {/* 両者のニックネーム */}
              <div className="bg-zinc-800 rounded-xl p-3 mb-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                  <span>申請者</span>
                  <span>お相手</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <MemberChip {...item.applicant} />
                  <span className="text-zinc-600 text-xs flex-shrink-0">↔</span>
                  <MemberChip {...item.target} />
                </div>
              </div>

              {/* 日時 */}
              <div className="mb-4 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    確定日時
                  </span>
                  <span className={item.scheduledAt ? 'text-zinc-200 font-medium' : 'text-zinc-600'}>
                    {item.scheduledAt ?? '未確定'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Video className="w-3 h-3" />
                    ZOOMリンク
                  </span>
                  <span className={item.zoomSent ? 'text-green-400' : 'text-zinc-500'}>
                    {item.zoomSent ? '送信済み ✓' : '未送信'}
                  </span>
                </div>
              </div>

              {/* ZOOMリンク送信ボタン */}
              <button
                onClick={() => router.push(`/admin/schedule/${item.applicationId}`)}
                disabled={item.status === 'scheduling'}
                className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                  item.status === 'confirmed' && !item.zoomSent
                    ? 'bg-teal-700 text-white hover:bg-teal-600'
                    : item.zoomSent
                    ? 'border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                {item.zoomSent
                  ? '詳細を見る'
                  : item.status === 'confirmed'
                  ? 'ZOOMリンクを送る'
                  : '日程調整中...'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
