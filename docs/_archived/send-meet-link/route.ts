import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const { matching_id, meet_url, memo } = (await req.json().catch(() => ({}))) as {
    matching_id?: string;
    meet_url?: string;
    memo?: string;
  };

  if (!matching_id || !meet_url) {
    return NextResponse.json({ error: 'パラメータが不足しています' }, { status: 400 });
  }
  if (!meet_url.startsWith('https://meet.google.com')) {
    return NextResponse.json({ error: '正しいGoogle Meetリンクを入力してください' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: matching, error: updateError } = await admin
    .from('matchings')
    .update({ zoom_url: meet_url, status: 'zoom_completed', ...(memo ? { admin_memo: memo } : {}) })
    .eq('id', matching_id)
    .select('applicant_id, partner_id, applied_at, amount')
    .single();

  if (updateError || !matching) {
    console.error('send-meet-link update error:', updateError);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }

  try {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, nickname, birth_date, prefecture, occupation')
      .in('id', [matching.applicant_id, matching.partner_id]);

    const profApplicant = profiles?.find((p) => p.id === matching.applicant_id);
    const profPartner = profiles?.find((p) => p.id === matching.partner_id);

    const [{ data: authApplicant }, { data: authPartner }] = await Promise.all([
      admin.auth.admin.getUserById(matching.applicant_id),
      admin.auth.admin.getUserById(matching.partner_id),
    ]);

    await fetch(`${req.nextUrl.origin}/api/admin/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
      },
      body: JSON.stringify({
        type: 'matching_approved',
        applicationId: matching_id,
        appliedAt: matching.applied_at ?? new Date().toISOString(),
        applicant: {
          nickname: profApplicant?.nickname ?? '',
          age: calcAge(profApplicant?.birth_date ?? '2000-01-01'),
          prefecture: profApplicant?.prefecture ?? '',
          occupation: profApplicant?.occupation ?? '',
          email: authApplicant?.user?.email ?? '',
        },
        member: {
          nickname: profPartner?.nickname ?? '',
          age: calcAge(profPartner?.birth_date ?? '2000-01-01'),
          prefecture: profPartner?.prefecture ?? '',
          occupation: profPartner?.occupation ?? '',
          email: authPartner?.user?.email ?? '',
        },
        amount: matching.amount ?? 0,
        meetUrl: meet_url,
      }),
    });
  } catch (notifyError) {
    console.error('send-meet-link notify error:', notifyError);
  }

  return NextResponse.json({ success: true });
}
