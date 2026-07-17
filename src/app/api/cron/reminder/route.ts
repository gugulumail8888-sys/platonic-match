import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { calculateAge } from '@/lib/utils';
import { refundOmiaiPayment } from '@/lib/refund';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type AdminClient = ReturnType<typeof createAdminClient>;

type ReminderType = 'payment_3days' | 'unpaid_cancel' | 'day_reminder' | 'survey_reminder' | 'matching_expired' | 'approval_email' | 'ai_option_renewal_reminder' | 'dormant_notice_batch' | 'ai_option_inactivity_notice';

type Matching = {
  id: string;
  applicant_id: string;
  partner_id: string;
  amount: number | null;
  applied_at: string | null;
  scheduled_at: string | null;
  zoom_url: string | null;
  payment_intent_id: string | null;
  partner_payment_intent_id: string | null;
  partner_amount: number | null;
};

type Person = {
  nickname: string;
  age: number;
  prefecture: string;
  occupation: string;
  email: string;
};

const MATCHING_COLUMNS = 'id, applicant_id, partner_id, amount, applied_at, scheduled_at, zoom_url, payment_intent_id, partner_payment_intent_id, partner_amount';

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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
    },
    body: JSON.stringify({
      type,
      applicationId: matching.id,
      appliedAt: matching.applied_at ?? new Date().toISOString(),
      applicant: personCache.get(matching.applicant_id),
      member: personCache.get(matching.partner_id),
      amount: matching.amount ?? 0,
      scheduledAt: matching.scheduled_at,
      meetUrl: matching.zoom_url,
      surveyUrl: `${origin}/omiai-survey?matchingId=${matching.id}`,
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
        .or('payment_intent_id.is.null,partner_payment_intent_id.is.null')
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
        .or('payment_intent_id.is.null,partner_payment_intent_id.is.null')
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

        // 片方だけ支払い済みの場合、その支払い済みの側へ自動返金する。
        // 両者とも未払いの場合は返金対象がない。
        if (matching.payment_intent_id && !matching.partner_payment_intent_id) {
          await refundOmiaiPayment(admin, matching.id, 'applicant', '前日17時までの相手方未入金による自動返金');
        } else if (!matching.payment_intent_id && matching.partner_payment_intent_id) {
          await refundOmiaiPayment(admin, matching.id, 'partner', '前日17時までの相手方未入金による自動返金');
        }

        await notifyAdmin(origin, 'cancel_unpaid', matching, personCache);
      }

      return NextResponse.json({ ok: true, count: matchings.length });
    }

    // ── ③ day_reminder: 10分後にお見合い → 当日リマインド ──
    if (type === 'day_reminder') {
      const nowMs = Date.now();
      const start = new Date(nowMs + 10 * 60 * 1000).toISOString();
      const end = new Date(nowMs + 15 * 60 * 1000).toISOString();

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

    // ── ④ survey_reminder: お見合い終了1〜2時間後 → アンケート依頼 ──
    if (type === 'survey_reminder') {
      const nowMs = Date.now();
      const start = new Date(nowMs - 2 * 60 * 60 * 1000).toISOString();
      const end = new Date(nowMs - 1 * 60 * 60 * 1000).toISOString();

      const { data, error } = await admin
        .from('matchings')
        .select(MATCHING_COLUMNS)
        .gte('scheduled_at', start)
        .lt('scheduled_at', end)
        .eq('status', 'zoom_completed');

      if (error) {
        console.error('survey_reminder fetch error:', error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
      }

      const matchings = (data ?? []) as Matching[];
      const personCache = await buildPersonCache(admin, matchings);
      for (const matching of matchings) {
        await notifyAdmin(origin, 'survey_reminder', matching, personCache);
      }

      return NextResponse.json({ ok: true, count: matchings.length });
    }

    // ── ⑤ matching_expired: 申請から7日以上経過・pending → 自動不成立 ──
    if (type === 'matching_expired') {
      const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await admin
        .from('matchings')
        .select(MATCHING_COLUMNS)
        .eq('status', 'pending')
        .lt('created_at', threshold);

      if (error) {
        console.error('matching_expired fetch error:', error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
      }

      const matchings = (data ?? []) as Matching[];
      const personCache = await buildPersonCache(admin, matchings);

      for (const matching of matchings) {
        const { error: updateError } = await admin
          .from('matchings')
          .update({ status: 'rejected', responded_at: new Date().toISOString() })
          .eq('id', matching.id);

        if (updateError) {
          console.error('matching_expired update error:', updateError);
          continue;
        }

        await notifyAdmin(origin, 'matching_expired', matching, personCache);
      }

      return NextResponse.json({ ok: true, count: matchings.length });
    }

    // ── approval_email: AI承認から15〜30分経過した未送信ユーザーに承認メール送信 ──
    if (type === 'approval_email') {
      const now = new Date();

      const { data: profiles, error } = await admin
        .from('profiles')
        .select('id, nickname, ai_verified_at')
        .eq('status', 'approved')
        .is('approval_email_sent_at', null)
        .not('ai_verified_at', 'is', null);

      if (error) {
        console.error('approval_email fetch error:', error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
      }

      let sentCount = 0;
      for (const profile of profiles ?? []) {
        const verifiedAt = new Date(profile.ai_verified_at!);
        const diffMinutes = (now.getTime() - verifiedAt.getTime()) / (1000 * 60);

        if (diffMinutes < 15 || diffMinutes > 30) continue;

        const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
        const email = authUser?.user?.email;
        if (!email) continue;

        await fetch(`${origin}/api/admin/notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            type: 'approval_document',
            user: { nickname: profile.nickname ?? 'ユーザー', email },
          }),
        });

        await admin
          .from('profiles')
          .update({ approval_email_sent_at: now.toISOString() })
          .eq('id', profile.id);

        sentCount++;
      }

      return NextResponse.json({ ok: true, sentCount });
    }

    // ── ⑥ ai_option_renewal_reminder: AIおすすめオプションの請求期間終了7日前 → リマインドメール ──
    if (type === 'ai_option_renewal_reminder') {
      const { start, end } = jstDayRange(7);
      const { data, error } = await admin
        .from('profiles')
        .select('id, nickname, current_period_end')
        .eq('is_premium', true)
        .gte('current_period_end', start)
        .lt('current_period_end', end);

      if (error) {
        console.error('ai_option_renewal_reminder fetch error:', error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
      }

      let sentCount = 0;
      for (const profile of data ?? []) {
        const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
        const email = authUser?.user?.email;
        if (!email) continue;

        await fetch(`${origin}/api/admin/notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            type: 'ai_option_renewal_reminder',
            user: { nickname: profile.nickname ?? 'ユーザー', email },
            renewalDate: profile.current_period_end,
          }),
        });

        sentCount++;
      }

      return NextResponse.json({ ok: true, sentCount });
    }

    // ── ⑦ dormant_notice_batch: 11ヶ月(335日)以上未ログインの会員へ、資格取消し30日前の通知メール送信 ──
    if (type === 'dormant_notice_batch') {
      const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (authError) {
        console.error('dormant_notice_batch listUsers error:', authError);
        return NextResponse.json({ error: 'ユーザー取得に失敗しました' }, { status: 500 });
      }

      const threshold = new Date(Date.now() - 335 * 24 * 60 * 60 * 1000);
      const dormantIds = authUsers.users
        .filter((u) => {
          const lastSignIn = u.last_sign_in_at ? new Date(u.last_sign_in_at) : new Date(u.created_at);
          return lastSignIn < threshold;
        })
        .map((u) => u.id);

      if (dormantIds.length === 0) {
        return NextResponse.json({ ok: true, sentCount: 0 });
      }

      const { data: profiles, error } = await admin
        .from('profiles')
        .select('id, nickname, status, dormant_notice_sent_at')
        .in('id', dormantIds)
        .neq('role', 'admin')
        .neq('status', 'withdrawn')
        .is('dormant_notice_sent_at', null);

      if (error) {
        console.error('dormant_notice_batch fetch error:', error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
      }

      const authMap = new Map(authUsers.users.map((u) => [u.id, u]));
      let sentCount = 0;
      for (const profile of profiles ?? []) {
        const email = authMap.get(profile.id)?.email;
        if (!email) continue;

        await fetch(`${origin}/api/admin/notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            type: 'dormant_notice',
            user: { nickname: profile.nickname ?? 'ユーザー', email },
          }),
        });

        await admin
          .from('profiles')
          .update({ dormant_notice_sent_at: new Date().toISOString() })
          .eq('id', profile.id);

        sentCount++;
      }

      return NextResponse.json({ ok: true, sentCount });
    }

    // ── ⑧ ai_option_inactivity_notice: AIおすすめオプション契約者が45日間隔で最大3回まで未ログイン通知(タスク#72) ──
    if (type === 'ai_option_inactivity_notice') {
      const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (authError) {
        console.error('ai_option_inactivity_notice listUsers error:', authError);
        return NextResponse.json({ error: 'ユーザー取得に失敗しました' }, { status: 500 });
      }

      const threshold = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
      const authMap = new Map(authUsers.users.map((u) => [u.id, u]));

      const inactiveIds: string[] = [];
      const activeIds: string[] = [];
      for (const u of authUsers.users) {
        const lastSignIn = u.last_sign_in_at ? new Date(u.last_sign_in_at) : new Date(u.created_at);
        if (lastSignIn < threshold) {
          inactiveIds.push(u.id);
        } else {
          activeIds.push(u.id);
        }
      }

      // 再ログイン済み(直近45日以内にログインあり)かつ過去に通知履歴が残っている会員は、次回の非アクティブ期間に備えてカウントをリセット
      if (activeIds.length > 0) {
        await admin
          .from('profiles')
          .update({ ai_inactivity_notice_count: 0, ai_inactivity_notice_sent_at: null })
          .in('id', activeIds)
          .eq('is_premium', true)
          .gt('ai_inactivity_notice_count', 0);
      }

      if (inactiveIds.length === 0) {
        return NextResponse.json({ ok: true, sentCount: 0 });
      }

      const { data: profiles, error } = await admin
        .from('profiles')
        .select('id, nickname, is_premium, ai_inactivity_notice_sent_at, ai_inactivity_notice_count')
        .in('id', inactiveIds)
        .eq('is_premium', true)
        .neq('status', 'withdrawn')
        .lt('ai_inactivity_notice_count', 3);

      if (error) {
        console.error('ai_option_inactivity_notice fetch error:', error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
      }

      let sentCount = 0;
      for (const profile of profiles ?? []) {
        // 前回送信から45日以上経過している場合のみ送信(1回目は未送信なので無条件、2・3回目は間隔をあける)
        if (profile.ai_inactivity_notice_sent_at) {
          const lastSent = new Date(profile.ai_inactivity_notice_sent_at);
          if (lastSent >= threshold) continue;
        }

        const email = authMap.get(profile.id)?.email;
        if (!email) continue;

        await fetch(`${origin}/api/admin/notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            type: 'ai_option_inactivity_notice',
            user: { nickname: profile.nickname ?? 'ユーザー', email },
          }),
        });

        await admin
          .from('profiles')
          .update({
            ai_inactivity_notice_sent_at: new Date().toISOString(),
            ai_inactivity_notice_count: profile.ai_inactivity_notice_count + 1,
          })
          .eq('id', profile.id);

        sentCount++;
      }

      return NextResponse.json({ ok: true, sentCount });
    }

    return NextResponse.json({ error: '不明なtypeです' }, { status: 400 });
  } catch (error) {
    console.error('Cron reminder error:', error);
    return NextResponse.json({ error: 'リマインダー処理に失敗しました' }, { status: 500 });
  }
}
