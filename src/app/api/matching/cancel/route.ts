import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

function calcAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export async function GET(req: NextRequest) {
  const applicationId = req.nextUrl.searchParams.get('applicationId');
  if (!applicationId) {
    return NextResponse.json({ error: 'applicationIdが必要です' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '未認証です' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: matching, error } = await admin
    .from('matchings')
    .select('applicant_id, partner_id, status, cancel_reported_by, second_cancel_reported_by')
    .eq('id', applicationId)
    .single();

  if (error || !matching) {
    return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
  }
  if (matching.applicant_id !== user.id && matching.partner_id !== user.id) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const otherPartyId = matching.applicant_id === user.id ? matching.partner_id : matching.applicant_id;
  const alreadyReportedByMe = matching.cancel_reported_by === user.id || matching.second_cancel_reported_by === user.id;
  const bothReported = !!matching.cancel_reported_by && !!matching.second_cancel_reported_by;
  const reportedByOther = matching.status === 'cancelled' && matching.cancel_reported_by === otherPartyId;

  let otherNickname = '';
  if (reportedByOther) {
    const { data: otherProfile } = await admin
      .from('profiles')
      .select('nickname')
      .eq('id', otherPartyId)
      .single();
    otherNickname = otherProfile?.nickname ?? '相手';
  }

  return NextResponse.json({
    status: matching.status,
    alreadyReportedByMe,
    reportedByOther,
    bothReported,
    otherNickname,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { applicationId, cancelReason, cancelDetail } = await req.json() as {
      applicationId: string;
      cancelReason: string;
      cancelDetail?: string;
    };

    if (!applicationId || !cancelReason) {
      return NextResponse.json({ error: '入力内容を確認してください' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '未認証です' }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: matching, error: matchingError } = await admin
      .from('matchings')
      .select('id, applicant_id, partner_id, applied_at, created_at')
      .eq('id', applicationId)
      .single();

    if (matchingError || !matching) {
      return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    }

    if (matching.applicant_id !== user.id && matching.partner_id !== user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    // ① 1件目の報告として、ステータスがまだcancelledでない場合のみ原子的に確定させる。
    // .neq('status', 'cancelled')条件付きUPDATEにすることで、同時に双方が報告した場合の競合状態(先着の内容が消えてしまう問題)を防ぐ。
    const { data: firstUpdate } = await admin
      .from('matchings')
      .update({ status: 'cancelled', cancel_reason: cancelReason, cancel_detail: cancelDetail ?? null, cancel_reported_by: user.id })
      .eq('id', applicationId)
      .neq('status', 'cancelled')
      .select('id')
      .maybeSingle();

    if (firstUpdate) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, nickname, birth_date, prefecture, occupation, is_premium')
        .in('id', [matching.applicant_id, matching.partner_id]);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const applicantProfile = profileMap.get(matching.applicant_id);
      const partnerProfile = profileMap.get(matching.partner_id);

      if (applicantProfile && partnerProfile) {
        const { data: applicantAuth } = await admin.auth.admin.getUserById(matching.applicant_id);
        const { data: partnerAuth } = await admin.auth.admin.getUserById(matching.partner_id);

        const amount = applicantProfile.is_premium ? 3000 : 3500;

        const cancellerIsApplicant = user.id === matching.applicant_id;
        const cancellerProfile = cancellerIsApplicant ? applicantProfile : partnerProfile;
        const cancellerAuth = cancellerIsApplicant ? applicantAuth : partnerAuth;
        const otherProfile = cancellerIsApplicant ? partnerProfile : applicantProfile;
        const otherAuth = cancellerIsApplicant ? partnerAuth : applicantAuth;

        await fetch(`${req.nextUrl.origin}/api/admin/notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            type: 'cancel_request',
            applicationId,
            appliedAt: matching.applied_at ?? matching.created_at,
            applicant: {
              nickname: cancellerProfile.nickname,
              age: calcAge(cancellerProfile.birth_date),
              prefecture: cancellerProfile.prefecture,
              occupation: cancellerProfile.occupation,
              email: cancellerAuth?.user?.email ?? '',
            },
            member: {
              nickname: otherProfile.nickname,
              age: calcAge(otherProfile.birth_date),
              prefecture: otherProfile.prefecture,
              occupation: otherProfile.occupation,
              email: otherAuth?.user?.email ?? '',
            },
            amount,
          }),
        });
      }

      return NextResponse.json({ ok: true });
    }

    // ② ①が0件更新＝すでにcancelled状態。2件目の報告として原子的に受け付ける。
    // cancel_reported_byが自分以外、かつsecond_cancel_reported_byが未設定の場合のみ成功する。
    const { data: secondUpdate } = await admin
      .from('matchings')
      .update({ second_cancel_reason: cancelReason, second_cancel_detail: cancelDetail ?? null, second_cancel_reported_by: user.id })
      .eq('id', applicationId)
      .neq('cancel_reported_by', user.id)
      .is('second_cancel_reported_by', null)
      .select('id')
      .maybeSingle();

    if (secondUpdate) {
      return NextResponse.json({ ok: true });
    }

    // ③ ①②いずれも0件更新＝すでに自分が報告済み、または双方とも報告済み。現在の状態を取得し適切なエラーを返す。
    const { data: current } = await admin
      .from('matchings')
      .select('cancel_reported_by, second_cancel_reported_by')
      .eq('id', applicationId)
      .single();

    if (current?.cancel_reported_by === user.id) {
      return NextResponse.json({ error: 'すでに報告済みです' }, { status: 400 });
    }
    if (current?.second_cancel_reported_by) {
      return NextResponse.json({ error: 'すでに双方から報告済みです' }, { status: 400 });
    }

    return NextResponse.json({ error: '処理に失敗しました。もう一度お試しください' }, { status: 500 });
  } catch (error) {
    console.error('Cancel error:', error);
    return NextResponse.json({ error: 'キャンセル処理に失敗しました' }, { status: 500 });
  }
}
