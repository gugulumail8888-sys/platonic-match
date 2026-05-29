'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, ClipboardList, Users, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ============================================================
// ダミーデータ（Supabase連携後はDBから取得）
// TODO: Supabase連携時にこのダミーデータを削除し、実データに置き換える
// ============================================================

type ApplicationStatus = 'pending' | 'scheduling' | 'completed';

interface Application {
  id: string;
  member: {
    id: number;
    nickname: string;
    age: number;
    prefecture: string;
    occupation: string;
    initials: string;
    avatarColor: string;
  };
  appliedAt: string;
  status: ApplicationStatus;
  amount: number;
}

const DUMMY_APPLICATIONS: Application[] = [
  {
    id: 'APP-847',
    member: {
      id: 6,
      nickname: 'けんじ',
      age: 32,
      prefecture: '東京都',
      occupation: '会社員（営業）',
      initials: 'け',
      avatarColor: '#0d9488',
    },
    appliedAt: '2026-05-24',
    status: 'pending',
    amount: 3000,
  },
  {
    id: 'APP-523',
    member: {
      id: 7,
      nickname: 'たける',
      age: 28,
      prefecture: '大阪府',
      occupation: 'ソフトウェアエンジニア',
      initials: 'た',
      avatarColor: '#2563eb',
    },
    appliedAt: '2026-05-20',
    status: 'scheduling',
    amount: 3000,
  },
  {
    id: 'APP-291',
    member: {
      id: 8,
      nickname: 'りょうた',
      age: 35,
      prefecture: '愛知県',
      occupation: '公務員（市役所）',
      initials: 'り',
      avatarColor: '#059669',
    },
    appliedAt: '2026-05-13',
    status: 'completed',
    amount: 3000,
  },
];

// ============================================================
// Status Badge
// ============================================================

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: '申請中',
    className: 'bg-amber-900/50 text-amber-300 border border-amber-800',
  },
  scheduling: {
    label: '日程調整中',
    className: 'bg-blue-900/50 text-blue-300 border border-blue-800',
  },
  completed: {
    label: '完了',
    className: 'bg-green-900/50 text-green-300 border border-green-800',
  },
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>
      {label}
    </span>
  );
}

// ============================================================
// Application Card
// ============================================================

function ApplicationCard({ app }: { app: Application }) {
  const router = useRouter();
  return (
    <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 hover:border-zinc-600 transition-all">
      {/* 上段: アバター + メンバー情報 + ステータス */}
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none"
          style={{ background: app.member.avatarColor }}
        >
          {app.member.initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-white font-semibold text-base">{app.member.nickname}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-400 mt-0.5">
                <span>{app.member.age}歳</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-teal-500" />
                  {app.member.prefecture}
                </span>
                <span>{app.member.occupation}</span>
              </div>
            </div>
            <StatusBadge status={app.status} />
          </div>
        </div>
      </div>

      {/* 区切り線 */}
      <div className="border-t border-zinc-700 my-4" />

      {/* 下段: 申請日・申請番号・料金 */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-zinc-500 mb-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            申請日
          </p>
          <p className="text-zinc-200 font-medium">{app.appliedAt}</p>
        </div>
        <div>
          <p className="text-zinc-500 mb-0.5 flex items-center gap-1">
            <ClipboardList className="w-3 h-3" />
            申請番号
          </p>
          <p className="text-zinc-200 font-mono font-medium">{app.id}</p>
        </div>
        <div>
          <p className="text-zinc-500 mb-0.5">料金</p>
          <p className="text-zinc-200 font-medium">
            {app.amount.toLocaleString()}円
            <span className="text-zinc-500 font-normal">（税込）</span>
          </p>
        </div>
      </div>

      {/* ボタンエリア */}
      <div className={`mt-4 ${app.status === 'scheduling' ? 'flex flex-col gap-2' : ''}`}>
        {/* 日程調整ボタン（日程調整中のみ表示） */}
        {app.status === 'scheduling' && (
          <Link
            href={`/schedule/request?id=${app.id}&name=${encodeURIComponent(app.member.nickname)}`}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md hover:scale-[1.02]"
            style={{ background: 'linear-gradient(to right, #ec4899, #a855f7)' }}
          >
            📅 日程を調整する
          </Link>
        )}

        {/* プロフィールリンク */}
        <Link
          href={`/members/${app.member.id}`}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-600 text-zinc-400 text-xs hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
        >
          プロフィールを見る
        </Link>

        {/* キャンセル・変更ボタン（完了済みのみ） */}
        {app.status === 'completed' && (
          <button
            onClick={() => router.push('/cancel-policy')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-900 text-red-500 text-xs hover:bg-red-950/50 hover:border-red-800 transition-colors w-full"
          >
            キャンセル・変更を申請する
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function MatchingPage() {
  const applications = DUMMY_APPLICATIONS;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* ページヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-teal-900/50 border border-teal-800 rounded-xl flex items-center justify-center flex-shrink-0">
          <HeartHandshake className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">お見合い申請履歴</h1>
          <p className="text-xs text-zinc-400">
            {applications.length}件の申請があります
          </p>
        </div>
      </div>

      {/* 申請一覧 */}
      {applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        /* 空状態UI */
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-5">
            <HeartHandshake className="w-9 h-9 text-zinc-600" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-300 mb-2">
            まだ申請がありません
          </h2>
          <p className="text-zinc-500 text-sm mb-6">
            会員一覧からお気に入りの方へ<br />
            お見合いを申請してみましょう！
          </p>
          <Link href="/members">
            <Button>
              <Users className="w-4 h-4" />
              会員一覧を見る
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
