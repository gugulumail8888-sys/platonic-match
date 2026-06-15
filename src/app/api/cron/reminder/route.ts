import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { calculateAge } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type AdminClient = ReturnType<typeof createAdminClient>;

type ReminderType = 'payment_3days' | 'unpaid_cancel' | 'day_reminder';

type Matching = {
  id: string;
  applicant_id: string;
  partner_id: string;
  amount: number | null;
  applied_at: string | null;
  scheduled_at: string | null;
  zoom_link: string | null;
  payment_intent_id: string | null;
};

type Person = {
  nickname: string;
  age: number;
  prefecture: string;
  occupation: string;
  email: string;
};

const MATCHING_COLUMNS = 'id, applicant_id, partner_id, amount, applied_at, scheduled_at, zoom_link, payment_intent_id';

// ============================================================
// 認証チェック（Bearerトークン）
// ============================================================

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.AUTHORIZATION_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

// ============================================================
// JST基準で「今日からN日後」の0:00〜翌0:00（UTC ISO文字列）を返す
// ============================================================

function jstDayRange(daysFromNow: number): { start: string; end: string } {
  const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const jstNow = new Date(Date.now() + JST_OFFSET_MS);
  const target = new Date(jstNow.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
  const startUtcMs = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate()) - JST_OFFSET_MS;
  return {
    start: new Date(startUtcMs).toISOString(),
    end: new Date(startUtcMs + 24 * 60 * 60 * 1000).toISOString(),
  };
}

// ============================================================
// 申請者・お相手のプロフィール＋メールアドレスをまとめて取得
// ============================================================

async function buildPersonCache(admin: AdminClient, matchings: Matching[]): Promise<Map<string, Person>> {
  const cache = new Map<string, Person>();
  const userIds = [...new Set(matchings.flatMap((m) => [m.applicant_id, m.partner_id]))];
  if (userIds.length === 0) return cache;

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, nickname, birth_date, prefecture, occupation')
    .in('id', userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  for (const id of userIds) {
    const profile = profileMap.get(id);
    const { data } = await admin.auth.admin.getUserById(id);
    cache.set(id, {
      nickname: profile?.nickname ?? '不明',
      age: profile?.birth_date ? calculateAge(profile.birth_date) : 0,
      prefecture: profile?.prefecture ?? '',
      occupation: profile?.occupation ?? '',
      email: data?.user?.email ?? '',
    });
  }
  return cache;
}

// ============================================================
// /api/admin/notify へ通知
// ============================================================

async function notifyAdmin(origin: string, type: string, matching: Matching, personCache: Map<string, Person>) {
  await fetch(`${origin}/api/admin/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      applicationId: matching.id,
      appliedAt: matching.applied_at ?? new Date().toISOString(),
      applicant: personCache.get(matching.applicant_id),
      member: personCache.get(matching.partner_id),
      amount: matching.amount ?? 0,
      scheduledAt: matching.scheduled_at,
      meetUrl: matching.zoom_link,
    }),
  });
}

// ============================================================
// Route Handler
// ============================================================

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: '未認証' }, { status: 401 });
    }

    const { type } = await req.json() as { type?: ReminderType };
    const admin = createAdminClient();
    const origin = req.nextUrl.origin;

    // ── ① payment_3days: お見合い日が3日後・未入金 → 支払いリマインド ──
    if (type === 'payment_3days') {
      const { start, end } = jstDayRange(3);
      const { data, error } = await admin
        .from('matchings')
        .select(MATCHING_COLUMNS)
        .gte('scheduled_at', start)
        .lt('scheduled_at', end)
        .is('payment_intent_id', null)
        .neq('status', 'cancelled');

      if (error) {
        console.error('payment_3days fetch error:', error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
      }

      const matchings = (data ?? []) as Matching[];
      const personCache = await buildPersonCache(admin, matchings);
      for (const matching of matchings) {
        await notifyAdmin(origin, 'payment_reminder', matching, personCache);
      }

      return NextResponse.json({ ok: true, count: matchings.length });
    }

    // ── ② unpaid_cancel: 前日17時を過ぎても未入金 → キャンセル ──
    if (type === 'unpaid_cancel') {
      const { start, end } = jstDayRange(1);
      const { data, error } = await admin
        .from('matchings')
        .select(MATCHING_COLUMNS)
        .gte('scheduled_at', start)
        .lt('scheduled_at', end)
        .is('payment_intent_id', null)
        .neq('status', 'cancelled');

      if (error) {
        console.error('unpaid_cancel fetch error:', error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
      }

      const matchings = (data ?? []) as Matching[];
      const personCache = await buildPersonCache(admin, matchings);

      for (const matching of matchings) {
        const { error: updateError } = await admin
          .from('matchings')
          .update({ status: 'cancelled', cancel_reason: '支払い期限超過' })
          .eq('id', matching.id);

        if (updateError) {
          console.error('unpaid_cancel update error:', updateError);
          continue;
        }

        await notifyAdmin(origin, 'cancel_unpaid', matching, personCache);
      }

      return NextResponse.json({ ok: true, count: matchings.length });
    }

    // ── ③ day_reminder: 2時間後にお見合い → 当日リマインド ──
    if (type === 'day_reminder') {
      const nowMs = Date.now();
      const start = new Date(nowMs + 2 * 60 * 60 * 1000).toISOString();
      const end = new Date(nowMs + 3 * 60 * 60 * 1000).toISOString();

      const { data, error } = await admin
        .from('matchings')
        .select(MATCHING_COLUMNS)
        .gte('scheduled_at', start)
        .lt('scheduled_at', end)
        .neq('status', 'cancelled');

      if (error) {
        console.error('day_reminder fetch error:', error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
      }

      const matchings = (data ?? []) as Matching[];
      const personCache = await buildPersonCache(admin, matchings);
      for (const matching of matchings) {
        await notifyAdmin(origin, 'day_reminder', matching, personCache);
      }

      return NextResponse.json({ ok: true, count: matchings.length });
    }

    return NextResponse.json({ error: '不明なtypeです' }, { status: 400 });
  } catch (error) {
    console.error('Cron reminder error:', error);
    return NextResponse.json({ error: 'リマインダー処理に失敗しました' }, { status: 500 });
  }
}
