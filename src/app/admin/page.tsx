export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Users, UserPlus, HeartHandshake, TrendingUp, MapPin, Sparkles } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { CAMPAIGN_SLOT_LIMIT, getCampaignPeriod } from '@/lib/campaign';

// ============================================================
// ステータスラベル設定（/admin/matching, /admin/members と同じ値）
// ============================================================

type AppStatus = 'pending' | 'scheduling' | 'zoom_completed' | 'completed' | 'cancelled' | 'rejected' | 'ended';

const APP_STATUS_CONFIG: Record<AppStatus, { label: string; className: string; barColor: string }> = {
  pending:        { label: '申請中',          className: 'bg-amber-900/50 text-amber-300 border border-amber-800', barColor: 'bg-amber-500' },
  scheduling:     { label: '日程調整中',      className: 'bg-blue-900/50  text-blue-300  border border-blue-800',  barColor: 'bg-blue-500'  },
  zoom_completed: { label: 'Google Meet送信済', className: 'bg-blue-900    text-blue-300',                            barColor: 'bg-sky-500'   },
  completed:      { label: '完了',            className: 'bg-green-900/50 text-green-300 border border-green-800', barColor: 'bg-green-500' },
  cancelled:      { label: 'キャンセル',      className: 'bg-red-900/50 text-red-300 border border-red-800',       barColor: 'bg-red-500'   },
  rejected:       { label: '拒否',            className: 'bg-zinc-700 text-zinc-400 border border-zinc-600',       barColor: 'bg-zinc-500'  },
  ended:          { label: '終了済み',        className: 'bg-zinc-800 text-zinc-400 border border-zinc-700',       barColor: 'bg-zinc-600'  },
};

const STATUS_ORDER: AppStatus[] = ['pending', 'scheduling', 'zoom_completed', 'completed', 'cancelled', 'rejected', 'ended'];

type MemberStatus = 'pending' | 'approved' | 'verified' | 'rejected' | 'withdrawn';

const MEMBER_STATUS_CONFIG: Record<MemberStatus, { label: string; className: string }> = {
  pending:   { label: '審査中',       className: 'bg-amber-900/50 text-amber-300 border border-amber-800' },
  approved:  { label: '承認済み',     className: 'bg-green-900/50 text-green-300 border border-green-800' },
  verified:  { label: '手動チェック済み', className: 'bg-teal-900/50 text-teal-300 border border-teal-800' },
  rejected:  { label: '拒否',         className: 'bg-zinc-700 text-zinc-400 border border-zinc-600' },
  withdrawn: { label: '退会済み',     className: 'bg-zinc-800 text-zinc-500 border border-zinc-700' },
};

// ============================================================
// 日時ヘルパー（サーバーのタイムゾーンに依存せず日本時間で計算する）
// ============================================================

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];

function jstShift(d: Date): Date {
  return new Date(d.getTime() + JST_OFFSET_MS);
}

// 指定した日本時間の年月日「0時0分」に対応するDate（UTC基準）を返す
function jstMidnightUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, -9, 0, 0));
}

function calcAge(birthDate: string | null): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP');
}

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

function Avatar({ nickname, avatarUrl, className }: { nickname: string; avatarUrl: string | null; className: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={nickname} className={`${className} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${className} rounded-full bg-teal-700 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {nickname.charAt(0)}
    </div>
  );
}

// ============================================================
// Page
// ============================================================

const PREMIUM_PAGE_SIZE = 10;

// AIおすすめオプションは1プランのみ(ライト/スタンダードの2階層UIは存在しない、2026/7/14確認)。
// DB上の値は既存データとの互換のため'standard'のまま、表示名のみ実態に合わせて統一する。
const SUBSCRIPTION_PLAN_LABELS: Record<string, string> = {
  standard: 'AIおすすめオプション',
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { premiumPage?: string };
}) {
  const supabase = createAdminClient();
  const { start: campaignStart, end: campaignEnd } = await getCampaignPeriod(supabase);

  const premiumPage = Math.max(1, parseInt(searchParams.premiumPage ?? '1', 10) || 1);

  // ── 日本時間での「今月」「先月」「直近7日間」の境界を算出 ──
  const nowShifted = jstShift(new Date());
  const todayY = nowShifted.getUTCFullYear();
  const todayM = nowShifted.getUTCMonth();
  const todayD = nowShifted.getUTCDate();

  const monthStart = jstMidnightUtc(todayY, todayM, 1);
  const nextMonthStart = jstMidnightUtc(todayY, todayM + 1, 1);
  const prevMonthStart = jstMidnightUtc(todayY, todayM - 1, 1);

  const monthStartIso = monthStart.toISOString();
  const nextMonthStartIso = nextMonthStart.toISOString();
  const prevMonthStartIso = prevMonthStart.toISOString();

  const sevenDaysAgoStart = jstMidnightUtc(todayY, todayM, todayD - 6);

  // ── データ取得（可能な範囲で並列化） ──
  const [
    { count: totalMembers },
    { count: maleMembers },
    { count: femaleMembers },
    { count: newMembersThisMonth },
    { count: newMembersLastMonth },
    { data: matchingsThisMonth },
    { data: revenueRows },
    { data: refundsThisMonth },
    { data: dailyMatchings },
    { data: recentAppsRaw },
    { data: recentMembers },
    { count: campaignSignupCount },
    { data: premiumMembers, count: premiumCount },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('gender', 'male'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('gender', 'female'),
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .gte('created_at', monthStartIso).lt('created_at', nextMonthStartIso),
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .gte('created_at', prevMonthStartIso).lt('created_at', monthStartIso),
    supabase.from('matchings').select('id, status, created_at')
      .gte('created_at', monthStartIso).lt('created_at', nextMonthStartIso),
    supabase.from('matchings').select('amount, partner_amount, paid_at, partner_paid_at')
      .or(`and(paid_at.gte.${monthStartIso},paid_at.lt.${nextMonthStartIso}),and(partner_paid_at.gte.${monthStartIso},partner_paid_at.lt.${nextMonthStartIso})`),
    supabase.from('refunds').select('amount')
      .gte('created_at', monthStartIso).lt('created_at', nextMonthStartIso),
    supabase.from('matchings').select('created_at')
      .gte('created_at', sevenDaysAgoStart.toISOString()),
    supabase.from('matchings')
      .select('id, status, created_at, amount, applicant_id, partner_id')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('profiles')
      .select('id, nickname, gender, birth_date, prefecture, status, avatar_url, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    // キャンペーン期間中にAIおすすめオプションを契約開始した人数(先着200名の消化状況確認用)
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .gte('subscription_started_at', campaignStart.toISOString())
      .lte('subscription_started_at', campaignEnd.toISOString()),
    // AIオプション契約者一覧（ダッシュボード新セクション用）
    supabase.from('profiles')
      .select('id, nickname, subscription_plan, subscription_started_at, current_period_end', { count: 'exact' })
      .eq('is_premium', true)
      .order('subscription_started_at', { ascending: false })
      .range((premiumPage - 1) * PREMIUM_PAGE_SIZE, premiumPage * PREMIUM_PAGE_SIZE - 1),
  ]);

  const premiumTotalPages = Math.max(1, Math.ceil((premiumCount ?? 0) / PREMIUM_PAGE_SIZE));

  // ── 最新申請の申請者・お相手プロフィールをまとめて取得 ──
  const recentApps = recentAppsRaw ?? [];
  const recentAppProfileIds = [
    ...new Set(recentApps.flatMap((a) => [a.applicant_id, a.partner_id])),
  ];
  const { data: recentAppProfiles } = recentAppProfileIds.length > 0
    ? await supabase.from('profiles').select('id, nickname, avatar_url').in('id', recentAppProfileIds)
    : { data: [] as { id: string; nickname: string; avatar_url: string | null }[] };
  const recentAppProfileMap = new Map((recentAppProfiles ?? []).map((p) => [p.id, p]));

  // ── 統計カード用の値を算出 ──
  const newMemberDiff = (newMembersThisMonth ?? 0) - (newMembersLastMonth ?? 0);
  const newMemberDiffLabel = `前月比 ${newMemberDiff > 0 ? '+' : ''}${newMemberDiff}名`;

  const matchingsCountThisMonth = matchingsThisMonth?.length ?? 0;

  const grossRevenue = (revenueRows ?? []).reduce((sum, m) => {
    let s = 0;
    if (m.paid_at && m.paid_at >= monthStartIso && m.paid_at < nextMonthStartIso) s += m.amount ?? 0;
    if (m.partner_paid_at && m.partner_paid_at >= monthStartIso && m.partner_paid_at < nextMonthStartIso) s += m.partner_amount ?? 0;
    return sum + s;
  }, 0);
  const refundTotal = (refundsThisMonth ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const refundCount = (refundsThisMonth ?? []).length;
  const netRevenue = grossRevenue - refundTotal;

  const STATS = [
    {
      label: '総会員数',
      value: `${totalMembers ?? 0}名`,
      sub: `男性 ${maleMembers ?? 0} / 女性 ${femaleMembers ?? 0}`,
      icon: Users,
      border: 'border-teal-800',
      iconBg: 'bg-teal-900/40',
      iconColor: 'text-teal-400',
    },
    {
      label: '今月の新規登録',
      value: `${newMembersThisMonth ?? 0}名`,
      sub: newMemberDiffLabel,
      icon: UserPlus,
      border: 'border-blue-800',
      iconBg: 'bg-blue-900/40',
      iconColor: 'text-blue-400',
    },
    {
      label: 'お見合い申請数',
      value: `${matchingsCountThisMonth}件`,
      sub: '今月の累計',
      icon: HeartHandshake,
      border: 'border-pink-800',
      iconBg: 'bg-pink-900/40',
      iconColor: 'text-pink-400',
    },
  ];

  // ── 直近7日間の申請数（日本時間基準） ──
  const dailyBuckets: { date: string; count: number }[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const dayStart = jstMidnightUtc(todayY, todayM, todayD - offset);
    const dayEnd = jstMidnightUtc(todayY, todayM, todayD - offset + 1);
    const count = (dailyMatchings ?? []).filter((m) => {
      const t = new Date(m.created_at).getTime();
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    }).length;
    const shiftedDay = jstShift(dayStart);
    const label = `${shiftedDay.getUTCMonth() + 1}/${shiftedDay.getUTCDate()}（${WEEKDAYS_JA[shiftedDay.getUTCDay()]}）`;
    dailyBuckets.push({ date: label, count });
  }
  const dailyMax = Math.max(1, ...dailyBuckets.map((d) => d.count));

  // ── ステータス別内訳（今月分） ──
  const statusBreakdown = STATUS_ORDER.map((status) => ({
    status,
    count: (matchingsThisMonth ?? []).filter((m) => m.status === status).length,
  }));

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

        {/* 今月の売上（純売上をメインに、総売上・返金額を併記） */}
        <div className="bg-zinc-900 rounded-2xl border border-green-800 p-5 flex items-start gap-4">
          <div className="bg-green-900/40 rounded-xl p-2.5 flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">今月の売上（純額）</p>
            <p className="text-2xl font-bold text-white leading-tight">¥{netRevenue.toLocaleString()}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              総売上 ¥{grossRevenue.toLocaleString()} − 返金 ¥{refundTotal.toLocaleString()}（{refundCount}件）
            </p>
          </div>
        </div>

        {/* キャンペーン契約者数（先着200名の消化状況） */}
        <div className="bg-zinc-900 rounded-2xl border border-purple-800 p-5 flex items-start gap-4">
          <div className="bg-purple-900/40 rounded-xl p-2.5 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">AIオプション キャンペーン契約者数</p>
            <p className="text-2xl font-bold text-white leading-tight">
              {campaignSignupCount ?? 0} / {CAMPAIGN_SLOT_LIMIT}名
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              先着{CAMPAIGN_SLOT_LIMIT}名到達で新規は特典対象外（トップページ・LPのキャンペーンバナーは到達時に自動的に非表示になります。2026/7/15対応）
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">
              ※キャンペーン期間中に契約開始した人数（解約済みも含む）。現在契約中の人数は下記「AIオプション契約者一覧」をご覧ください。
            </p>
          </div>
        </div>
      </div>

      {/* ===== 中段：日次・ステータス内訳 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 直近7日間の申請数 */}
        <SectionCard title="直近7日間の申請数">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2 text-xs text-zinc-500 font-medium whitespace-nowrap">日付</th>
                <th className="text-right py-2 text-xs text-zinc-500 font-medium whitespace-nowrap">申請数</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {dailyBuckets.map((d) => (
                <tr key={d.date} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="py-2.5 text-zinc-300">{d.date}</td>
                  <td className="py-2.5 text-right font-mono font-medium text-white">
                    {d.count}件
                  </td>
                  <td className="py-2.5 pl-3 w-32">
                    <div className="bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full"
                        style={{ width: `${(d.count / dailyMax) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </SectionCard>

        {/* ステータス別内訳 */}
        <SectionCard title="ステータス別申請数">
          <div className="space-y-3">
            {statusBreakdown.map(({ status, count }) => {
              const cfg = APP_STATUS_CONFIG[status];
              const pct = matchingsCountThisMonth > 0 ? Math.round((count / matchingsCountThisMonth) * 100) : 0;
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
                      className={`h-full rounded-full ${cfg.barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-zinc-500 pt-1 text-right">合計 {matchingsCountThisMonth}件</p>
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
              {recentApps.map((app) => {
                const cfg = APP_STATUS_CONFIG[app.status as AppStatus];
                const applicant = recentAppProfileMap.get(app.applicant_id);
                const partner = recentAppProfileMap.get(app.partner_id);
                return (
                  <tr key={app.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-3 py-3 font-mono text-zinc-300 text-xs">{app.id.slice(0, 8)}</td>
                    <td className="px-3 py-3">
                      {applicant ? (
                        <div className="flex items-center gap-2">
                          <Avatar nickname={applicant.nickname} avatarUrl={applicant.avatar_url} className="w-6 h-6 text-[10px]" />
                          <span className="text-zinc-200">{applicant.nickname}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs">不明</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {partner ? (
                        <div className="flex items-center gap-2">
                          <Avatar nickname={partner.nickname} avatarUrl={partner.avatar_url} className="w-6 h-6 text-[10px]" />
                          <span className="text-zinc-200">{partner.nickname}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs">不明</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-zinc-400 text-xs">{formatDate(app.created_at)}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg?.className ?? 'bg-zinc-700 text-zinc-300'}`}>
                        {cfg?.label ?? app.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-zinc-300 text-xs">
                      ¥{(app.amount ?? 0).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {recentApps.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-zinc-500 text-xs">申請はまだありません</td>
                </tr>
              )}
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
              {(recentMembers ?? []).map((m) => {
                const cfg = MEMBER_STATUS_CONFIG[m.status as MemberStatus];
                return (
                  <tr key={m.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar nickname={m.nickname} avatarUrl={m.avatar_url} className="w-7 h-7 text-xs" />
                        <Link
                          href={`/admin/members/${m.id}`}
                          className="text-zinc-200 hover:text-teal-400 transition-colors"
                        >
                          {m.nickname}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-zinc-400 text-xs">
                      {m.gender === 'male' ? '男性' : m.gender === 'female' ? '女性' : 'その他'}
                    </td>
                    <td className="px-3 py-3 text-zinc-400 text-xs">{calcAge(m.birth_date)}歳</td>
                    <td className="px-3 py-3 text-zinc-400 text-xs">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-teal-500" />
                        {m.prefecture}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-zinc-400 text-xs">{formatDate(m.created_at)}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg?.className ?? 'bg-zinc-700 text-zinc-300'}`}>
                        {cfg?.label ?? m.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {(recentMembers ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-zinc-500 text-xs">会員はまだいません</td>
                </tr>
              )}
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

      {/* ===== AIオプション契約者一覧 ===== */}
      <SectionCard title={`AIオプション契約者一覧（全${premiumCount ?? 0}件）`}>
        <p className="text-[10px] text-zinc-600 -mt-2 mb-3">
          ※現在契約中（is_premium）の会員一覧です。契約開始時期は問いません。上記「AIオプション キャンペーン契約者数」（キャンペーン期間中に契約開始した人数）とは集計範囲が異なるため件数が一致しない場合があります。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-zinc-800">
                {['ニックネーム', 'プラン', '契約開始日', '次回更新日'].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs text-zinc-400 font-medium uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(premiumMembers ?? []).map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-3 py-3">
                    <Link href={`/admin/members/${p.id}`} className="text-zinc-200 hover:text-teal-400 transition-colors">
                      {p.nickname}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-zinc-400 text-xs">
                    {SUBSCRIPTION_PLAN_LABELS[p.subscription_plan ?? ''] ?? p.subscription_plan ?? '-'}
                  </td>
                  <td className="px-3 py-3 text-zinc-400 text-xs">
                    {p.subscription_started_at ? formatDate(p.subscription_started_at) : '-'}
                  </td>
                  <td className="px-3 py-3 text-zinc-400 text-xs">
                    {p.current_period_end ? formatDate(p.current_period_end) : '-'}
                  </td>
                </tr>
              ))}
              {(premiumMembers ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-zinc-500 text-xs">AIオプション契約者はまだいません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {(premiumCount ?? 0) > 0 && (
          <div className="flex items-center justify-end gap-2 mt-3">
            {premiumPage > 1 ? (
              <Link
                href={`/admin?premiumPage=${premiumPage - 1}`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
              >
                前へ
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-800 text-zinc-600">前へ</span>
            )}
            <span className="text-xs text-zinc-400">{premiumPage} / {premiumTotalPages}</span>
            {premiumPage < premiumTotalPages ? (
              <Link
                href={`/admin?premiumPage=${premiumPage + 1}`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
              >
                次へ
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-800 text-zinc-600">次へ</span>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
