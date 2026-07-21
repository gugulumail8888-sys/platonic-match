import { NextResponse } from 'next/server';
import { formatInTimeZone } from 'date-fns-tz';
import { addDays } from 'date-fns';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

const TZ = 'Asia/Tokyo';

export const GENDER_LABELS: Record<string, string> = {
  male: '男性',
  female: '女性',
  other: 'その他',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: '承認待ち',
  approved: '承認済み',
  rejected: '却下',
  withdrawn: '退会済み',
};

export interface ExportProfileRow {
  id: string;
  last_name: string | null;
  first_name: string | null;
  nickname: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  status: string;
  created_at: string;
  withdrawn_at: string | null;
  subscription_started_at: string | null;
}

const CSV_HEADERS = [
  'ユーザーID', '姓', '名', 'メールアドレス', '電話番号', '生年月日', '性別',
  'ステータス', '登録日時', 'AIおすすめオプション契約日', '退会日時', '本人確認書類削除予定日時', '登録情報削除予定日時', 'いいね履歴', 'ブロック履歴',
  '申請してお見合いをした回数', '申請を受けてお見合いをした回数',
  '申請してキャンセルされた回数', '申請を受けてキャンセルされた回数',
  '返金回数（申請者側）', '返金金額合計（申請者側）', '返金回数（お相手側）', '返金金額合計（お相手側）',
];

// 「お見合いをした」とみなすステータス（Google Meet URL発行以降）
const MEETING_HAPPENED_STATUSES = new Set(['zoom_completed', 'completed', 'ended']);

// ── 管理者権限チェック ──
export async function requireAdminUser(): Promise<
  { error: NextResponse } | { admin: SupabaseClient }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: '未認証' }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: '権限がありません' }, { status: 403 }) };
  }

  return { admin };
}

// ── CSV ユーティリティ ──
export function escapeCsvField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsvRow(values: unknown[]): string {
  return values.map(escapeCsvField).join(',') + '\r\n';
}

export function csvBom(): string {
  return '﻿';
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  return formatInTimeZone(new Date(value), TZ, 'yyyy-MM-dd HH:mm:ss');
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  return formatInTimeZone(new Date(value), TZ, 'yyyy-MM-dd');
}

export function fullName(p?: { last_name?: string | null; first_name?: string | null; nickname?: string | null } | null): string {
  if (!p) return '';
  const name = `${p.last_name ?? ''}${p.first_name ?? ''}`.trim();
  return name || p.nickname || '';
}

// ── auth.users からメールアドレスを取得 ──
export async function fetchEmailMap(admin: SupabaseClient, userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (userIds.length === 0) return map;

  const idSet = new Set(userIds);
  const perPage = 1000;
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data) break;
    for (const u of data.users) {
      if (idSet.has(u.id)) map.set(u.id, u.email ?? '');
    }
    if (data.users.length < perPage) break;
    page += 1;
  }
  return map;
}

// ── CSV本体生成 ──
export async function buildUsersCsv(admin: SupabaseClient, profiles: ExportProfileRow[]): Promise<string> {
  let csv = '﻿' + toCsvRow(CSV_HEADERS);
  if (profiles.length === 0) return csv;

  const userIds = profiles.map((p) => p.id);

  const emailMap = await fetchEmailMap(admin, userIds);

  // いいね履歴（送信・受信）
  const idList = userIds.join(',');
  const { data: likes } = await admin
    .from('likes')
    .select('sender_id, receiver_id, created_at')
    .or(`sender_id.in.(${idList}),receiver_id.in.(${idList})`);

  const likesByUser = new Map<string, { partnerId: string; created_at: string; type: string }[]>();
  const partnerIds = new Set<string>();
  for (const l of likes ?? []) {
    if (userIds.includes(l.sender_id)) {
      partnerIds.add(l.receiver_id);
      const list = likesByUser.get(l.sender_id) ?? [];
      list.push({ partnerId: l.receiver_id, created_at: l.created_at, type: '送信' });
      likesByUser.set(l.sender_id, list);
    }
    if (userIds.includes(l.receiver_id)) {
      partnerIds.add(l.sender_id);
      const list = likesByUser.get(l.receiver_id) ?? [];
      list.push({ partnerId: l.sender_id, created_at: l.created_at, type: '受信' });
      likesByUser.set(l.receiver_id, list);
    }
  }

  // ブロック履歴（した・された）
  const { data: blocks } = await admin
    .from('blocks')
    .select('blocker_id, blocked_id, created_at')
    .or(`blocker_id.in.(${idList}),blocked_id.in.(${idList})`);

  const blocksByUser = new Map<string, { partnerId: string; created_at: string; type: string }[]>();
  for (const b of blocks ?? []) {
    if (!b.blocker_id || !b.blocked_id) continue;
    if (userIds.includes(b.blocker_id)) {
      partnerIds.add(b.blocked_id);
      const list = blocksByUser.get(b.blocker_id) ?? [];
      list.push({ partnerId: b.blocked_id, created_at: b.created_at, type: 'ブロックした' });
      blocksByUser.set(b.blocker_id, list);
    }
    if (userIds.includes(b.blocked_id)) {
      partnerIds.add(b.blocker_id);
      const list = blocksByUser.get(b.blocked_id) ?? [];
      list.push({ partnerId: b.blocker_id, created_at: b.created_at, type: 'ブロックされた' });
      blocksByUser.set(b.blocked_id, list);
    }
  }

  // 相手のnickname解決用プロフィール
  const allProfileIds = new Set([...userIds, ...partnerIds]);
  const { data: nameProfiles } = await admin
    .from('profiles')
    .select('id, nickname')
    .in('id', Array.from(allProfileIds));
  const nicknameMap = new Map((nameProfiles ?? []).map((p) => [p.id, p.nickname ?? '']));

  // お見合い実績・キャンセル回数の集計（申請者側/お相手側で分けて集計）
  const { data: userMatchings } = await admin
    .from('matchings')
    .select('id, applicant_id, partner_id, status')
    .or(`applicant_id.in.(${idList}),partner_id.in.(${idList})`);

  const meetingAsApplicant = new Map<string, number>();
  const meetingAsPartner = new Map<string, number>();
  const cancelAsApplicant = new Map<string, number>();
  const cancelAsPartner = new Map<string, number>();

  for (const m of userMatchings ?? []) {
    if (userIds.includes(m.applicant_id)) {
      if (MEETING_HAPPENED_STATUSES.has(m.status)) {
        meetingAsApplicant.set(m.applicant_id, (meetingAsApplicant.get(m.applicant_id) ?? 0) + 1);
      }
      if (m.status === 'cancelled') {
        cancelAsApplicant.set(m.applicant_id, (cancelAsApplicant.get(m.applicant_id) ?? 0) + 1);
      }
    }
    if (m.partner_id && userIds.includes(m.partner_id)) {
      if (MEETING_HAPPENED_STATUSES.has(m.status)) {
        meetingAsPartner.set(m.partner_id, (meetingAsPartner.get(m.partner_id) ?? 0) + 1);
      }
      if (m.status === 'cancelled') {
        cancelAsPartner.set(m.partner_id, (cancelAsPartner.get(m.partner_id) ?? 0) + 1);
      }
    }
  }

  // 返金回数・返金金額の集計（申請者側/お相手側で分けて集計）
  const { data: userRefunds } = await admin
    .from('refunds')
    .select('refund_to_user_id, amount, schedule_id')
    .in('refund_to_user_id', userIds);

  const refundScheduleIds = [...new Set((userRefunds ?? []).map((r) => r.schedule_id))];
  const { data: refundMatchings } = refundScheduleIds.length > 0
    ? await admin.from('matchings').select('id, applicant_id, partner_id').in('id', refundScheduleIds)
    : { data: [] as { id: string; applicant_id: string; partner_id: string | null }[] };
  const refundMatchingMap = new Map((refundMatchings ?? []).map((m) => [m.id, m]));

  const refundCountApplicant = new Map<string, number>();
  const refundAmountApplicant = new Map<string, number>();
  const refundCountPartner = new Map<string, number>();
  const refundAmountPartner = new Map<string, number>();

  for (const r of userRefunds ?? []) {
    const m = refundMatchingMap.get(r.schedule_id);
    if (!m) continue;
    if (m.applicant_id === r.refund_to_user_id) {
      refundCountApplicant.set(r.refund_to_user_id, (refundCountApplicant.get(r.refund_to_user_id) ?? 0) + 1);
      refundAmountApplicant.set(r.refund_to_user_id, (refundAmountApplicant.get(r.refund_to_user_id) ?? 0) + (r.amount ?? 0));
    } else if (m.partner_id === r.refund_to_user_id) {
      refundCountPartner.set(r.refund_to_user_id, (refundCountPartner.get(r.refund_to_user_id) ?? 0) + 1);
      refundAmountPartner.set(r.refund_to_user_id, (refundAmountPartner.get(r.refund_to_user_id) ?? 0) + (r.amount ?? 0));
    }
  }

  for (const p of profiles) {
    const isWithdrawn = p.status === 'withdrawn' && !!p.withdrawn_at;
    const hasName = !!(p.last_name || p.first_name);

    const likeHistory = (likesByUser.get(p.id) ?? [])
      .map((l) => `${nicknameMap.get(l.partnerId) ?? ''}（${formatDateTime(l.created_at)} / ${l.type}）`)
      .join('\n') || 'なし';

    const blockHistory = (blocksByUser.get(p.id) ?? [])
      .map((b) => `${nicknameMap.get(b.partnerId) ?? ''}（${formatDateTime(b.created_at)} / ${b.type}）`)
      .join('\n') || 'なし';

    csv += toCsvRow([
      p.id,
      hasName ? (p.last_name ?? '') : (p.nickname ?? ''),
      hasName ? (p.first_name ?? '') : '',
      emailMap.get(p.id) ?? '',
      p.phone ? `="${p.phone}"` : '未登録',
      formatDate(p.birth_date),
      GENDER_LABELS[p.gender ?? ''] ?? (p.gender ?? ''),
      STATUS_LABELS[p.status] ?? p.status,
      formatDateTime(p.created_at),
      formatDateTime(p.subscription_started_at),
      isWithdrawn ? formatDateTime(p.withdrawn_at) : '-',
      isWithdrawn ? formatInTimeZone(addDays(new Date(p.withdrawn_at!), 365), TZ, 'yyyy-MM-dd HH:mm:ss') : '-',
      isWithdrawn ? formatInTimeZone(addDays(new Date(p.withdrawn_at!), 1095), TZ, 'yyyy-MM-dd HH:mm:ss') : '-',
      likeHistory,
      blockHistory,
      meetingAsApplicant.get(p.id) ?? 0,
      meetingAsPartner.get(p.id) ?? 0,
      cancelAsApplicant.get(p.id) ?? 0,
      cancelAsPartner.get(p.id) ?? 0,
      refundCountApplicant.get(p.id) ?? 0,
      refundAmountApplicant.get(p.id) ?? 0,
      refundCountPartner.get(p.id) ?? 0,
      refundAmountPartner.get(p.id) ?? 0,
    ]);
  }

  return csv;
}

export function csvFilename(prefix: string): string {
  return `${prefix}_${formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd')}.csv`;
}

export const EXPORT_PROFILE_COLUMNS =
  'id, last_name, first_name, nickname, phone, birth_date, gender, status, created_at, withdrawn_at, subscription_started_at';

// ── ユーザー検索 ──
export interface SearchExportParams {
  name?: string;
  email?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: 'created_at' | 'withdrawn_at';
  target?: 'all' | 'withdrawn';
}

function escapeIlike(value: string): string {
  return value.replace(/[%_]/g, (c) => `\\${c}`);
}

export async function searchExportProfiles(
  admin: SupabaseClient,
  params: SearchExportParams
): Promise<{ profiles: ExportProfileRow[]; emailMap: Map<string, string> }> {
  const dateField = params.dateField === 'withdrawn_at' ? 'withdrawn_at' : 'created_at';

  let query = admin
    .from('profiles')
    .select(EXPORT_PROFILE_COLUMNS);

  if (params.target === 'withdrawn') {
    query = query.eq('status', 'withdrawn');
  }

  const name = params.name?.trim();
  if (name) {
    const term = escapeIlike(name);
    query = query.or(`last_name.ilike.%${term}%,first_name.ilike.%${term}%,nickname.ilike.%${term}%`);
  }

  if (params.dateFrom) {
    query = query.gte(dateField, params.dateFrom);
  }
  if (params.dateTo) {
    query = query.lte(dateField, `${params.dateTo}T23:59:59.999`);
  }

  // dateField(created_at/withdrawn_at)で絞り込んでいる場合は、その基準列で並び替える
  // (以前はcreated_at固定だったため、退会日で絞り込んでも並び順が意図と合わない問題があった)。
  // withdrawn_atはtarget=allの場合null(未退会)を含みうるため、nullsFirst: falseで
  // 未退会分が先頭に来ないようにする。
  const { data, error } = await query.order(dateField, { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);

  let profiles = (data ?? []) as ExportProfileRow[];
  const emailMap = await fetchEmailMap(admin, profiles.map((p) => p.id));

  const email = params.email?.trim().toLowerCase();
  if (email) {
    profiles = profiles.filter((p) => (emailMap.get(p.id) ?? '').toLowerCase().includes(email));
  }

  return { profiles, emailMap };
}
