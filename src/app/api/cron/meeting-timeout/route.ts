import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { calculateAge } from '@/lib/utils';
import { checkRealMeetingAttendance } from '@/lib/google-meet';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type AdminClient = ReturnType<typeof createAdminClient>;

type MeetingTimeoutType = 'meeting_timeout_cancel' | 'meeting_force_end';

type Matching = {
  id: string;
  applicant_id: string;
  partner_id: string;
  amount: number | null;
  applied_at: string | null;
  scheduled_at: string | null;
  user1_joined_at: string | null;
  user2_joined_at: string | null;
  meeting_ended_at: string | null;
  zoom_url: string | null;
};

type Person = {
  nickname: string;
  age: number;
  prefecture: string;
  occupation: string;
  email: string;
};

const MATCHING_COLUMNS =
  'id, applicant_id, partner_id, amount, applied_at, scheduled_at, user1_joined_at, user2_joined_at, meeting_ended_at, zoom_url';

// ============================================================
// 認証チェック（Bearerトークン）
// ============================================================

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.AUTHORIZATION_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
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
// /api/admin/notify（cancel_timeout）へ通知
// ============================================================

async function notifyCancelTimeout(
  origin: string,
  matching: Matching,
  personCache: Map<string, Person>,
  lateBy: 'applicant' | 'member' | 'both'
) {
  await fetch(`${origin}/api/admin/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
    },
    body: JSON.stringify({
      type: 'cancel_timeout',
      applicationId: matching.id,
      appliedAt: matching.applied_at ?? new Date().toISOString(),
      applicant: personCache.get(matching.applicant_id),
      member: personCache.get(matching.partner_id),
      amount: matching.amount ?? 0,
      lateBy,
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

    const { type } = await req.json() as { type?: MeetingTimeoutType };
    const admin = createAdminClient();
    const origin = req.nextUrl.origin;

    // ── ① meeting_timeout_cancel: 開始15分経過しても未入室の当事者がいる → 強制キャンセル ──
    if (type === 'meeting_timeout_cancel') {
      const threshold = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data, error } = await admin
        .from('matchings')
        .select(MATCHING_COLUMNS)
        .eq('status', 'zoom_completed')
        .is('meeting_ended_at', null)
        .lte('scheduled_at', threshold);

      if (error) {
        console.error('meeting_timeout_cancel fetch error:', error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
      }

      const matchings = (data ?? []) as Matching[];
      const personCache = await buildPersonCache(admin, matchings);

      let processed = 0;
      for (const matching of matchings) {
        const applicantMissing = matching.user1_joined_at === null;
        const partnerMissing = matching.user2_joined_at === null;

        if (!applicantMissing && !partnerMissing) continue;

        // Meet API上で実際の入室状況を確認し、2名以上の参加が確認できれば
        // ボタンクリック記録が欠けていても強制キャンセルの対象から除外する
        if (matching.zoom_url) {
          const attendance = await checkRealMeetingAttendance(
            matching.zoom_url,
            matching.scheduled_at ?? new Date().toISOString()
          );
          if (attendance && attendance.participantCount >= 2) {
            console.log(
              'meeting_timeout_cancel skip（Meet APIで2名以上の入室を確認）:',
              matching.id,
              'participantCount=', attendance.participantCount,
              'earliestStartTimes=', attendance.participants.map((p) => p.earliestStartTime)
            );
            continue;
          }
        }

        const lateBy: 'applicant' | 'member' | 'both' = applicantMissing && partnerMissing
          ? 'both'
          : applicantMissing
            ? 'applicant'
            : 'member';

        const { error: updateError } = await admin
          .from('matchings')
          .update({ status: 'cancelled', cancel_reason: 'お見合い開始15分超過' })
          .eq('id', matching.id);

        if (updateError) {
          console.error('meeting_timeout_cancel update error:', updateError);
          continue;
        }

        await notifyCancelTimeout(origin, matching, personCache, lateBy);
        processed++;
      }

      return NextResponse.json({ processed });
    }

    // ── ② meeting_force_end: 開始50分経過 → 強制終了 ──
    if (type === 'meeting_force_end') {
      const threshold = new Date(Date.now() - 50 * 60 * 1000).toISOString();
      const { data, error } = await admin
        .from('matchings')
        .select(MATCHING_COLUMNS)
        .eq('status', 'zoom_completed')
        .is('meeting_ended_at', null)
        .lte('scheduled_at', threshold);

      if (error) {
        console.error('meeting_force_end fetch error:', error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
      }

      const matchings = (data ?? []) as Matching[];

      let processed = 0;
      for (const matching of matchings) {
        const { error: updateError } = await admin
          .from('matchings')
          .update({ status: 'ended', meeting_ended_at: new Date().toISOString() })
          .eq('id', matching.id);

        if (updateError) {
          console.error('meeting_force_end update error:', updateError);
          continue;
        }

        processed++;
      }

      return NextResponse.json({ processed });
    }

    return NextResponse.json({ error: '不明なtypeです' }, { status: 400 });
  } catch (error) {
    console.error('Meeting timeout cron error:', error);
    return NextResponse.json({ error: '処理に失敗しました' }, { status: 500 });
  }
}
