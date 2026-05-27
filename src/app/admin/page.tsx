'use client';

import Link from 'next/link';
import { Users, UserPlus, HeartHandshake, TrendingUp, MapPin } from 'lucide-react';
import {
  ADMIN_APPLICATIONS, ADMIN_MEMBERS,
  APP_STATUS_CONFIG, MEMBER_STATUS_CONFIG,
} from './_data';

// ============================================================
// 統計データ（ダミー）
// ============================================================

const STATS = [
  {
    label: '総会員数',
    value: '128名',
    sub: '男性 62 / 女性 66',
    icon: Users,
    border: 'border-teal-800',
    iconBg: 'bg-teal-900/40',
    iconColor: 'text-teal-400',
  },
  {
    label: '今月の新規登録',
    value: '23名',
    sub: '前月比 +3名',
    icon: UserPlus,
    border: 'border-blue-800',
    iconBg: 'bg-blue-900/40',
    iconColor: 'text-blue-400',
  },
  {
    label: 'お見合い申請数',
    value: '47件',
    sub: '今月の累計',
    icon: HeartHandshake,
    border: 'border-pink-800',
    iconBg: 'bg-pink-900/40',
    iconColor: 'text-pink-400',
  },
  {
    label: '今月の売上',
    value: '¥141,000',
    sub: '47件 × ¥3,000',
    icon: TrendingUp,
    border: 'border-green-800',
    iconBg: 'bg-green-900/40',
    iconColor: 'text-green-400',
  },
];

// 直近7日間（ダミー）
const DAILY_DATA = [
  { date: '5/21（水）', count: 6 },
  { date: '5/22（木）', count: 8 },
  { date: '5/23（金）', count: 4 },
  { date: '5/24（土）', count: 7 },
  { date: '5/25（日）', count: 5 },
  { date: '5/26（月）', count: 9 },
  { date: '5/27（火）', count: 3 },
];

const STATUS_BREAKDOWN = [
  { status: 'pending'    as const, count: 18 },
  { status: 'scheduling' as const, count: 15 },
  { status: 'completed'  as const, count: 14 },
];

// 最新5件
const RECENT_APPS = [...ADMIN_APPLICATIONS]
  .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
  .slice(0, 5);

// ============================================================
// Sub-components
// ============================================================

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
      <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-teal-500 rounded-full" />
        {title}
      </h2>
      {children}
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function AdminDashboardPage() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-white">ダッシュボード</h1>
        <p className="text-sm text-zinc-400 mt-0.5">amista 管理者パネル</p>
      </div>

      {/* ===== 統計カード ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`bg-zinc-900 rounded-2xl border ${s.border} p-5 flex items-start gap-4`}
            >
              <div className={`${s.iconBg} rounded-xl p-2.5 flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-white leading-tight">{s.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== 中段：日次・ステータス内訳 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 直近7日間の申請数 */}
        <SectionCard title="直近7日間の申請数">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2 text-xs text-zinc-500 font-medium">日付</th>
                <th className="text-right py-2 text-xs text-zinc-500 font-medium">申請数</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {DAILY_DATA.map((d) => (
                <tr key={d.date} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="py-2.5 text-zinc-300">{d.date}</td>
                  <td className="py-2.5 text-right font-mono font-medium text-white">
                    {d.count}件
                  </td>
                  <td className="py-2.5 pl-3 w-32">
                    <div className="bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full"
                        style={{ width: `${(d.count / 9) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        {/* ステータス別内訳 */}
        <SectionCard title="ステータス別申請数">
          <div className="space-y-3">
            {STATUS_BREAKDOWN.map(({ status, count }) => {
              const cfg = APP_STATUS_CONFIG[status];
              const pct = Math.round((count / 47) * 100);
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.className}`}>
                      {cfg.label}
                    </span>
                    <span className="text-white font-semibold tabular-nums">
                      {count}件
                      <span className="text-zinc-500 font-normal text-xs ml-1">({pct}%)</span>
                    </span>
                  </div>
                  <div className="bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        status === 'pending' ? 'bg-amber-500' :
                        status === 'scheduling' ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-zinc-500 pt-1 text-right">合計 47件</p>
          </div>
        </SectionCard>
      </div>

      {/* ===== 最新申請一覧 ===== */}
      <SectionCard title="最新申請（直近5件）">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-800">
                {['申請番号', '申請者', '相手', '申請日', 'ステータス', '料金'].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs text-zinc-400 font-medium uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {RECENT_APPS.map((app) => {
                const cfg = APP_STATUS_CONFIG[app.status];
                return (
                  <tr key={app.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-3 py-3 font-mono text-zinc-300 text-xs">{app.id}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                          style={{ background: app.applicant.avatarColor }}
                        >
                          {app.applicant.initials}
                        </div>
                        <span className="text-zinc-200">{app.applicant.nickname}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                          style={{ background: app.target.avatarColor }}
                        >
                          {app.target.initials}
                        </div>
                        <span className="text-zinc-200">{app.target.nickname}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-zinc-400 text-xs">{app.appliedAt}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-zinc-300 text-xs">
                      ¥{app.amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-right">
          <Link
            href="/admin/matching"
            className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
          >
            すべての申請を見る →
          </Link>
        </div>
      </SectionCard>

      {/* ===== 最新会員 ===== */}
      <SectionCard title="最新登録会員（直近5名）">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-zinc-800">
                {['会員', '性別', '年齢', '居住地', '登録日', 'ステータス'].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs text-zinc-400 font-medium uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {[...ADMIN_MEMBERS]
                .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
                .slice(0, 5)
                .map((m) => {
                  const cfg = MEMBER_STATUS_CONFIG[m.memberStatus];
                  return (
                    <tr key={m.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: m.avatarColor }}
                          >
                            {m.initials}
                          </div>
                          <div>
                            <Link
                              href={`/admin/members/${m.id}`}
                              className="text-zinc-200 hover:text-teal-400 transition-colors"
                            >
                              {m.nickname}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-zinc-400 text-xs">
                        {m.gender === 'male' ? '男性' : '女性'}
                      </td>
                      <td className="px-3 py-3 text-zinc-400 text-xs">{m.age}歳</td>
                      <td className="px-3 py-3 text-zinc-400 text-xs">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-500" />
                          {m.prefecture}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-zinc-400 text-xs">{m.registeredAt}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-right">
          <Link
            href="/admin/members"
            className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
          >
            すべての会員を見る →
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
