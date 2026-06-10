import { NextResponse } from 'next/server';
import { formatInTimeZone } from 'date-fns-tz';
import { addMonths } from 'date-fns';
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

export const MATCH_STATUS_LABELS: Record<string, string> = {
  active: '有効',
  blocked: 'ブロック',
  deleted: '削除済み',
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
}

const CSV_HEADERS = [
  'ユーザーID', '姓', '名', 'メールアドレス', '電話番号', '生年月日', '性別',
  'ステータス', '登録日時', '退会日時', '削除予定日時', 'マッチング履歴', 'メッセージ履歴',
];

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
function escapeCsvField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(values: unknown[]): string {
  return values.map(escapeCsvField).join(',') + '\r\n';
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

  // マッチング履歴
  const idList = userIds.join(',');
  const { data: matches } = await admin
    .from('matches')
    .select('id, user1_id, user2_id, status, matched_at')
    .or(`user1_id.in.(${idList}),user2_id.in.(${idList})`);

  const matchesByUser = new Map<string, { partnerId: string; matched_at: string; status: string }[]>();
  const partnerIds = new Set<string>();
  for (const m of matches ?? []) {
    for (const uid of [m.user1_id, m.user2_id]) {
      if (!userIds.includes(uid)) continue;
      const partnerId = uid === m.user1_id ? m.user2_id : m.user1_id;
      partnerIds.add(partnerId);
      const list = matchesByUser.get(uid) ?? [];
      list.push({ partnerId, matched_at: m.matched_at, status: m.status });
      matchesByUser.set(uid, list);
    }
  }

  // メッセージ履歴（送信したメッセージのみ）
  const matchMap = new Map((matches ?? []).map((m) => [m.id, m]));
  const { data: messages } = await admin
    .from('messages')
    .select('match_id, sender_id, content, created_at')
    .in('sender_id', userIds)
    .order('created_at', { ascending: true });

  const messagesByUser = new Map<string, { partnerId: string; content: string; created_at: string }[]>();
  for (const msg of messages ?? []) {
    const match = matchMap.get(msg.match_id);
    if (!match) continue;
    const partnerId = msg.sender_id === match.user1_id ? match.user2_id : match.user1_id;
    partnerIds.add(partnerId);
    const list = messagesByUser.get(msg.sender_id) ?? [];
    list.push({ partnerId, content: msg.content, created_at: msg.created_at });
    messagesByUser.set(msg.sender_id, list);
  }

  // 相手の氏名解決用プロフィール
  const allProfileIds = new Set([...userIds, ...partnerIds]);
  const { data: nameProfiles } = await admin
    .from('profiles')
    .select('id, last_name, first_name, nickname')
    .in('id', Array.from(allProfileIds));
  const nameMap = new Map((nameProfiles ?? []).map((p) => [p.id, p]));

  for (const p of profiles) {
    const isWithdrawn = p.status === 'withdrawn' && !!p.withdrawn_at;

    const matchHistory = (matchesByUser.get(p.id) ?? [])
      .map((m) => `${fullName(nameMap.get(m.partnerId))}（${formatDateTime(m.matched_at)} / ${MATCH_STATUS_LABELS[m.status] ?? m.status}）`)
      .join('\n');

    const messageHistory = (messagesByUser.get(p.id) ?? [])
      .map((m) => `[${formatDateTime(m.created_at)}] →${fullName(nameMap.get(m.partnerId))}: ${m.content}`)
      .join('\n');

    csv += toCsvRow([
      p.id,
      p.last_name ?? '',
      p.first_name ?? '',
      emailMap.get(p.id) ?? '',
      p.phone ?? '',
      formatDate(p.birth_date),
      GENDER_LABELS[p.gender ?? ''] ?? (p.gender ?? ''),
      STATUS_LABELS[p.status] ?? p.status,
      formatDateTime(p.created_at),
      isWithdrawn ? formatDateTime(p.withdrawn_at) : '',
      isWithdrawn ? formatInTimeZone(addMonths(new Date(p.withdrawn_at!), 3), TZ, 'yyyy-MM-dd HH:mm:ss') : '',
      matchHistory,
      messageHistory,
    ]);
  }

  return csv;
}

export function csvFilename(prefix: string): string {
  return `${prefix}_${formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd')}.csv`;
}

export const EXPORT_PROFILE_COLUMNS =
  'id, last_name, first_name, nickname, phone, birth_date, gender, status, created_at, withdrawn_at';

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
    query = query.or(`last_name.ilike.%${term}%,first_name.ilike.%${term}%`);
  }

  if (params.dateFrom) {
    query = query.gte(dateField, params.dateFrom);
  }
  if (params.dateTo) {
    query = query.lte(dateField, `${params.dateTo}T23:59:59.999`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  let profiles = (data ?? []) as ExportProfileRow[];
  const emailMap = await fetchEmailMap(admin, profiles.map((p) => p.id));

  const email = params.email?.trim().toLowerCase();
  if (email) {
    profiles = profiles.filter((p) => (emailMap.get(p.id) ?? '').toLowerCase().includes(email));
  }

  return { profiles, emailMap };
}
