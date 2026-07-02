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

    const { matchingId, proposedAtList } = await req.json() as {
      matchingId?: string;
      proposedAtList?: string[];
    };

    if (!matchingId) return NextResponse.json({ error: 'matchingIdが必要です' }, { status: 400 });
    if (!Array.isArray(proposedAtList) || proposedAtList.length < 3 || proposedAtList.length > 5) {
      return NextResponse.json({ error: '候補日時は3〜5件で指定してください' }, { status: 400 });
    }

    const admin = createAdminClient();

    // マッチング情報取得
    const { data: matching, error: fetchError } = await admin
      .from('matchings')
      .select('id, applicant_id, partner_id, status, applied_at, created_at')
      .eq('id', matchingId)
      .maybeSingle();

    if (fetchError || !matching) {
      return NextResponse.json({ error: 'お見合い申請が見つかりません' }, { status: 404 });
    }
    if (matching.applicant_id !== user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    if (matching.status !== 'scheduling') {
      return NextResponse.json({ error: '日程調整中の申請ではありません' }, { status: 409 });
    }

    // 既存slotを削除（再提案対応）してから再insert
    const { error: deleteError } = await admin
      .from('schedule_slots')
      .delete()
      .eq('matching_id', matchingId);

    if (deleteError) {
      console.error('schedule_slots delete error:', deleteError);
      return NextResponse.json({ error: '候補日程の更新に失敗しました' }, { status: 500 });
    }

    const { error: insertError } = await admin
      .from('schedule_slots')
      .insert(
        proposedAtList.map((proposedAt) => ({
          matching_id: matchingId,
          proposed_at: proposedAt,
          proposed_by: user.id,
        }))
      );

    if (insertError) {
      console.error('schedule_slots insert error:', insertError);
      return NextResponse.json({ error: '候補日程の登録に失敗しました' }, { status: 500 });
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

    // お相手へ通知メール
    await fetch(`${req.nextUrl.origin}/api/admin/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
      },
      body: JSON.stringify({
        type: 'schedule_proposed',
        applicationId: matching.id,
        appliedAt: matching.applied_at ?? matching.created_at,
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
    console.error('Schedule propose error:', error);
    return NextResponse.json({ error: '候補日程の送信に失敗しました' }, { status: 500 });
  }
}
