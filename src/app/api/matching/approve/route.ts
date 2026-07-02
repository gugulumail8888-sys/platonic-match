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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

    const { matchingId } = await req.json() as { matchingId?: string };
    if (!matchingId) return NextResponse.json({ error: 'matchingIdが必要です' }, { status: 400 });

    const admin = createAdminClient();

    // マッチング情報取得
    const { data: matching, error: fetchError } = await admin
      .from('matchings')
      .select('id, applicant_id, partner_id, status, amount, applied_at, created_at')
      .eq('id', matchingId)
      .maybeSingle();

    if (fetchError || !matching) {
      return NextResponse.json({ error: 'お見合い申請が見つかりません' }, { status: 404 });
    }
    if (matching.partner_id !== user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    if (matching.status !== 'pending') {
      return NextResponse.json({ error: 'すでに処理済みの申請です' }, { status: 409 });
    }

    // ステータスをschedulingに更新
    const { error: updateError } = await admin
      .from('matchings')
      .update({ status: 'scheduling', responded_at: new Date().toISOString() })
      .eq('id', matchingId);

    if (updateError) {
      console.error('Approve update error:', updateError);
      return NextResponse.json({ error: '承認処理に失敗しました' }, { status: 500 });
    }

    // 両者のプロフィール取得
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, nickname, birth_date, prefecture, occupation')
      .in('id', [matching.applicant_id, matching.partner_id]);

    const profApplicant = profiles?.find((p) => p.id === matching.applicant_id);
    const profPartner   = profiles?.find((p) => p.id === matching.partner_id);

    // 両者のメールアドレス取得
    const { data: authApplicant } = await admin.auth.admin.getUserById(matching.applicant_id);
    const { data: authPartner }   = await admin.auth.admin.getUserById(matching.partner_id);

    const applicantEmail = authApplicant?.user?.email ?? '';
    const partnerEmail   = authPartner?.user?.email ?? '';

    // 通知メール送信（両者へ）
    await fetch(`${req.nextUrl.origin}/api/admin/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
      },
      body: JSON.stringify({
        type: 'matching_approved',
        applicationId: matching.id,
        appliedAt: matching.applied_at ?? matching.created_at,
        applicant: {
          nickname:   profApplicant?.nickname   ?? '',
          age:        calcAge(profApplicant?.birth_date ?? '2000-01-01'),
          prefecture: profApplicant?.prefecture ?? '',
          occupation: profApplicant?.occupation ?? '',
          email:      applicantEmail,
        },
        member: {
          nickname:   profPartner?.nickname   ?? '',
          age:        calcAge(profPartner?.birth_date ?? '2000-01-01'),
          prefecture: profPartner?.prefecture ?? '',
          occupation: profPartner?.occupation ?? '',
          email:      partnerEmail,
        },
        amount: matching.amount ?? 0,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Approve route error:', error);
    return NextResponse.json({ error: '承認処理に失敗しました' }, { status: 500 });
  }
}
