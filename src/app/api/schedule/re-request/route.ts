import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { matchingId, message } = await req.json();
  if (!matchingId || !message?.trim()) {
    return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  // マッチング情報を取得
  const { data: matching } = await adminSupabase
    .from('matchings')
    .select('applicant_id, partner_id, status')
    .eq('id', matchingId)
    .single();

  if (!matching) return NextResponse.json({ error: 'マッチングが見つかりません' }, { status: 404 });
  if (matching.status !== 'scheduling') return NextResponse.json({ error: '無効なステータスです' }, { status: 400 });

  // リクエスト送信者がpartner_idであることを確認
  if (matching.partner_id !== user.id) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  // 申請者のメールアドレスを取得
  const { data: applicantAuth } = await adminSupabase.auth.admin.getUserById(matching.applicant_id);
  const applicantEmail = applicantAuth?.user?.email;

  // 申請者のニックネームを取得
  const { data: applicantProfile } = await adminSupabase
    .from('profiles')
    .select('nickname')
    .eq('id', matching.applicant_id)
    .single();

  // 依頼者（partner）のニックネームを取得
  const { data: partnerProfile } = await adminSupabase
    .from('profiles')
    .select('nickname')
    .eq('id', matching.partner_id)
    .single();

  // schedule_slotsを削除してリセット
  await adminSupabase
    .from('schedule_slots')
    .delete()
    .eq('matching_id', matchingId);

  // matchingsのscheduled_atをnullにリセット
  await adminSupabase
    .from('matchings')
    .update({ scheduled_at: null })
    .eq('id', matchingId);

  // 申請者へ再提案依頼メールを送信
  if (applicantEmail) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}`,
      },
      body: JSON.stringify({
        type: 're_request_schedule',
        to: applicantEmail,
        applicantNickname: applicantProfile?.nickname ?? '相手',
        partnerNickname: partnerProfile?.nickname ?? 'お相手',
        re_request_message: message.trim(),
        matchingId,
      }),
    });
  }

  return NextResponse.json({ success: true });
}
