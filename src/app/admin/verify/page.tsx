'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShieldX, Clock, FileText, MapPin } from 'lucide-react';

// ============================================================
// Types & Data
// ============================================================

type VerifyStatus = 'pending' | 'approved' | 'rejected';

interface VerifyItem {
  id: string;
  nickname: string;
  age: number;
  prefecture: string;
  gender: 'male' | 'female';
  submittedAt: string;
  docType: string;
  status: VerifyStatus;
  avatarColor: string;
  initials: string;
}

const STATUS_CONFIG: Record<VerifyStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending:  { label: '審査待ち', className: 'bg-amber-900/50 text-amber-300 border border-amber-800',  icon: Clock },
  approved: { label: '承認済み', className: 'bg-green-900/50 text-green-300 border border-green-800',  icon: ShieldCheck },
  rejected: { label: '否認',     className: 'bg-red-900/50 text-red-300 border border-red-800',        icon: ShieldX },
};

const DUMMY_VERIFY: VerifyItem[] = [
  {
    id: 'VRF-001',
    nickname: 'さくら',
    age: 30,
    prefecture: '東京都',
    gender: 'female',
    submittedAt: '2026-05-25',
    docType: '運転免許証',
    status: 'pending',
    avatarColor: '#e879a0',
    initials: 'さ',
  },
  {
    id: 'VRF-002',
    nickname: 'たける',
    age: 28,
    prefecture: '大阪府',
    gender: 'male',
    submittedAt: '2026-05-24',
    docType: 'マイナンバーカード',
    status: 'pending',
    avatarColor: '#2563eb',
    initials: 'た',
  },
  {
    id: 'VRF-003',
    nickname: 'みらい',
    age: 26,
    prefecture: '神奈川県',
    gender: 'female',
    submittedAt: '2026-05-23',
    docType: 'パスポート',
    status: 'pending',
    avatarColor: '#7c3aed',
    initials: 'み',
  },
  {
    id: 'VRF-004',
    nickname: 'けんじ',
    age: 32,
    prefecture: '東京都',
    gender: 'male',
    submittedAt: '2026-05-20',
    docType: '運転免許証',
    status: 'approved',
    avatarColor: '#0d9488',
    initials: 'け',
  },
  {
    id: 'VRF-005',
    nickname: 'あかね',
    age: 27,
    prefecture: '愛知県',
    gender: 'female',
    submittedAt: '2026-05-18',
    docType: '健康保険証',
    status: 'rejected',
    avatarColor: '#dc2626',
    initials: 'あ',
  },
];

// ============================================================
// Sub-components
// ============================================================

function StatusBadge({ status }: { status: VerifyStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ============================================================
// Page
// ============================================================

type FilterTab = 'all' | VerifyStatus;

const FILTER_OPTIONS: { value: FilterTab; label: string }[] = [
  { value: 'all',      label: 'すべて' },
  { value: 'pending',  label: '審査待ち' },
  { value: 'approved', label: '承認済み' },
  { value: 'rejected', label: '否認' },
];

export default function AdminVerifyPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = DUMMY_VERIFY.filter((v) =>
    filter === 'all' ? true : v.status === filter
  );

  const counts = {
    all:      DUMMY_VERIFY.length,
    pending:  DUMMY_VERIFY.filter((v) => v.status === 'pending').length,
    approved: DUMMY_VERIFY.filter((v) => v.status === 'approved').length,
    rejected: DUMMY_VERIFY.filter((v) => v.status === 'rejected').length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-white">本人確認審査</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          全 {DUMMY_VERIFY.length} 件（ダミーデータ）
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
        <div className="text-center py-16 text-zinc-500">該当する申請が見つかりませんでした</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 hover:border-zinc-700 transition-all"
            >
              {/* 上段: アバター + 基本情報 + バッジ */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none"
                  style={{ background: item.avatarColor }}
                >
                  {item.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white font-semibold">{item.nickname}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                        <span>{item.age}歳</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-teal-500" />
                          {item.prefecture}
                        </span>
                        <span>·</span>
                        <span>{item.gender === 'male' ? '男性' : '女性'}</span>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              </div>

              {/* 書類情報 */}
              <div className="bg-zinc-800 rounded-xl p-3 mb-4 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    書類種類
                  </span>
                  <span className="text-zinc-200 font-medium">{item.docType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">提出日</span>
                  <span className="text-zinc-200">{item.submittedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">審査番号</span>
                  <span className="text-zinc-400 font-mono">{item.id}</span>
                </div>
              </div>

              {/* 審査ボタン */}
              <button
                onClick={() => router.push(`/admin/verify/${item.id}`)}
                className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                  item.status === 'pending'
                    ? 'bg-teal-700 text-white hover:bg-teal-600'
                    : 'border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {item.status === 'pending' ? '審査する' : '詳細を見る'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
