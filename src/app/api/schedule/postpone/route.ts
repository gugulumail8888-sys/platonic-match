import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// 「予定日の前日17時(JST)」を延期申し出期限として算出する
function getPostponeDeadline(scheduledAt: string): Date {
  const scheduled = new Date(scheduledAt);
  const jstMs = scheduled.getTime() + 9 * 60 * 60 * 1000;
  const jst = new Date(jstMs);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth();
  const d = jst.getUTCDate();
  // 17:00 JST = 08:00 UTC
  return new Date(Date.UTC(y, m, d - 1, 8, 0, 0));
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

    const { matchingId } = await req.json() as { matchingId?: string };
    if (!matchingId) return NextResponse.json({ error: 'matchingIdが必要です' }, { status: 400 });

    const admin = createAdminClient();

    const { data: matching, error: fetchError } = await admin
      .from('matchings')
      .select('id, applicant_id, partner_id, status, scheduled_at, applied_at, created_at, postponed_count')
      .eq('id', matchingId)
      .maybeSingle();

    if (fetchError || !matching) {
      return NextResponse.json({ error: 'お見合い申請が見つかりません' }, { status: 404 });
    }
    if (matching.applicant_id !== user.id && matching.partner_id !== user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    if (matching.status !== 'scheduling' || !matching.scheduled_at) {
      return NextResponse.json({ error: '延期できる状態ではありません' }, { status: 409 });
    }
    if ((matching.postponed_count ?? 0) >= 1) {
      return NextResponse.json({ error: '延期は原則1回までです' }, { status: 409 });
    }

    const deadline = getPostponeDeadline(matching.scheduled_at);
    if (Date.now() > deadline.getTime()) {
      return NextResponse.json({ error: '延期の申し出期限（予定日の前日17時）を過ぎています' }, { status: 409 });
    }

    await admin.from('schedule_slots').delete().eq('matching_id', matchingId);

    const { error: updateError } = await admin
      .from('matchings')
      .update({
        scheduled_at: null,
        zoom_url: null,
        postponed_count: (matching.postponed_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchingId);

    if (updateError) {
      console.error('schedule postpone update error:', updateError);
      return NextResponse.json({ error: '延期処理に失敗しました' }, { status: 500 });
    }

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, nickname, birth_date, prefecture, occupation')
      .in('id', [matching.applicant_id, matching.partner_id]);

    const profApplicant = profiles?.find((p) => p.id === matching.applicant_id);
    const profPartner   = profiles?.find((p) => p.id === matching.partner_id);

    const { data: authApplicant } = await admin.auth.admin.getUserById(matching.applicant_id);
    const { data: authPartner }   = await admin.auth.admin.getUserById(matching.partner_id);

    const requestedByApplicant = matching.applicant_id === user.id;

    await fetch(`${req.nextUrl.origin}/api/admin/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
      },
      body: JSON.stringify({
        type: 'schedule_postponed',
        applicationId: matching.id,
        appliedAt: matching.applied_at ?? matching.created_at,
        requestedBy: requestedByApplicant ? 'applicant' : 'member',
        applicant: {
          nickname:   profApplicant?.nickname   ?? '',
          age:        calcAge(profApplicant?.birth_date ?? '2000-01-01'),
          prefecture: profApplicant?.prefecture ?? '',
          occupation: profApplicant?.occupation ?? '',
          email:      authApplicant?.user?.email ?? '',
        },
        member: {
          nickname:   profPartner?.nickname   ?? '',
          age:        calcAge(profPartner?.birth_date ?? '2000-01-01'),
          prefecture: profPartner?.prefecture ?? '',
          occupation: profPartner?.occupation ?? '',
          email:      authPartner?.user?.email ?? '',
        },
        amount: 0,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Schedule postpone error:', error);
    return NextResponse.json({ error: '延期処理に失敗しました' }, { status: 500 });
  }
}
