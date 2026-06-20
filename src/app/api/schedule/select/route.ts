import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createGoogleMeetUrl } from '@/lib/google-meet';

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

    const { slotId } = await req.json() as { slotId?: string };
    if (!slotId) return NextResponse.json({ error: 'slotIdが必要です' }, { status: 400 });

    const admin = createAdminClient();

    // slot取得
    const { data: slot, error: slotError } = await admin
      .from('schedule_slots')
      .select('id, matching_id, proposed_at')
      .eq('id', slotId)
      .maybeSingle();

    if (slotError || !slot) {
      return NextResponse.json({ error: '候補日程が見つかりません' }, { status: 404 });
    }

    // マッチング情報取得・権限チェック
    const { data: matching, error: matchingError } = await admin
      .from('matchings')
      .select('id, applicant_id, partner_id, status, applied_at, created_at')
      .eq('id', slot.matching_id)
      .maybeSingle();

    if (matchingError || !matching) {
      return NextResponse.json({ error: 'お見合い申請が見つかりません' }, { status: 404 });
    }
    if (matching.partner_id !== user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    if (matching.status !== 'scheduling') {
      return NextResponse.json({ error: '日程調整中の申請ではありません' }, { status: 409 });
    }

    // 他のslotを未選択に戻し、選択したslotをis_selected=trueに更新
    const { error: resetError } = await admin
      .from('schedule_slots')
      .update({ is_selected: false })
      .eq('matching_id', matching.id);

    if (resetError) {
      console.error('schedule_slots reset error:', resetError);
      return NextResponse.json({ error: '日程確定処理に失敗しました' }, { status: 500 });
    }

    const { error: selectError } = await admin
      .from('schedule_slots')
      .update({ is_selected: true })
      .eq('id', slotId);

    if (selectError) {
      console.error('schedule_slots select error:', selectError);
      return NextResponse.json({ error: '日程確定処理に失敗しました' }, { status: 500 });
    }

    // Google Meet URLを生成（環境変数未設定の場合はnull）
    const meetUrl = await createGoogleMeetUrl(slot.proposed_at, 'amista お見合い');

    // matchingsの確定日時・Meet URLを更新
    const { error: updateError } = await admin
      .from('matchings')
      .update({
        scheduled_at: slot.proposed_at,
        zoom_url: meetUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matching.id);

    if (updateError) {
      console.error('matchings update error:', updateError);
      return NextResponse.json({ error: '日程確定処理に失敗しました' }, { status: 500 });
    }

    // 両者のプロフィール・メールアドレス取得
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, nickname, birth_date, prefecture, occupation')
      .in('id', [matching.applicant_id, matching.partner_id]);

    const profApplicant = profiles?.find((p) => p.id === matching.applicant_id);
    const profPartner   = profiles?.find((p) => p.id === matching.partner_id);

    const { data: authApplicant } = await admin.auth.admin.getUserById(matching.applicant_id);
    const { data: authPartner }   = await admin.auth.admin.getUserById(matching.partner_id);

    // 両者へ確定通知メール
    await fetch(`${req.nextUrl.origin}/api/admin/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'schedule_confirmed',
        applicationId: matching.id,
        appliedAt: matching.applied_at ?? matching.created_at,
        scheduledAt: slot.proposed_at,
        meetUrl,
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
    console.error('Schedule select error:', error);
    return NextResponse.json({ error: '日程確定処理に失敗しました' }, { status: 500 });
  }
}
