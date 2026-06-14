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

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '未認証です' }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: matching, error: matchingError } = await admin
      .from('matchings')
      .select('id, status, applicant_id, partner_id, applied_at, created_at')
      .eq('id', applicationId)
      .single();

    if (matchingError || !matching) {
      return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    }

    if (matching.applicant_id !== user.id && matching.partner_id !== user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    if (matching.status === 'cancelled') {
      return NextResponse.json({ error: 'すでにキャンセル済みです' }, { status: 400 });
    }

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, nickname, birth_date, prefecture, occupation, is_premium')
      .in('id', [matching.applicant_id, matching.partner_id]);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const applicantProfile = profileMap.get(matching.applicant_id);
    const partnerProfile = profileMap.get(matching.partner_id);

    if (!applicantProfile || !partnerProfile) {
      return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 });
    }

    const { data: applicantAuth } = await admin.auth.admin.getUserById(matching.applicant_id);
    const { data: partnerAuth } = await admin.auth.admin.getUserById(matching.partner_id);

    const amount = applicantProfile.is_premium ? 3000 : 3500;

    await admin
      .from('matchings')
      .update({ status: 'cancelled', cancel_reason: cancelReason, cancel_detail: cancelDetail ?? null })
      .eq('id', applicationId);

    // キャンセルした側が「申請者」、もう一方が「お相手」として通知メールを送る
    const cancellerIsApplicant = user.id === matching.applicant_id;
    const cancellerProfile = cancellerIsApplicant ? applicantProfile : partnerProfile;
    const cancellerAuth = cancellerIsApplicant ? applicantAuth : partnerAuth;
    const otherProfile = cancellerIsApplicant ? partnerProfile : applicantProfile;
    const otherAuth = cancellerIsApplicant ? partnerAuth : applicantAuth;

    await fetch(`${req.nextUrl.origin}/api/admin/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Cancel error:', error);
    return NextResponse.json({ error: 'キャンセル処理に失敗しました' }, { status: 500 });
  }
}
