import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const matchingId = req.nextUrl.searchParams.get('matchingId');
    if (!matchingId) {
      return NextResponse.json({ error: 'matchingIdが必要です' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '未認証です' }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: matching, error: matchingError } = await admin
      .from('matchings')
      .select('id, applicant_id, partner_id, zoom_url, status, meeting_ended_at')
      .eq('id', matchingId)
      .single();

    if (matchingError || !matching) {
      return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    }

    if (matching.applicant_id !== user.id && matching.partner_id !== user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const partnerId = user.id === matching.applicant_id ? matching.partner_id : matching.applicant_id;
    const { data: partnerProfile } = await admin
      .from('profiles')
      .select('nickname')
      .eq('id', partnerId)
      .single();

    return NextResponse.json({
      zoom_url: matching.zoom_url,
      status: matching.status,
      meeting_ended_at: matching.meeting_ended_at,
      nickname: partnerProfile?.nickname ?? null,
    });
  } catch (error) {
    console.error('Matching fetch error:', error);
    return NextResponse.json({ error: 'お見合い情報の取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { matchingId } = await req.json() as { matchingId: string };

    if (!matchingId) {
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
      .select('id, applicant_id, partner_id, status, user1_joined_at, user2_joined_at, meeting_ended_at')
      .eq('id', matchingId)
      .single();

    if (matchingError || !matching) {
      return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    }

    if (matching.applicant_id !== user.id && matching.partner_id !== user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    if (matching.status !== 'zoom_completed') {
      return NextResponse.json({ error: 'お見合い準備が完了していません' }, { status: 400 });
    }

    if (matching.meeting_ended_at !== null) {
      return NextResponse.json({ error: 'このお見合いは終了しています' }, { status: 400 });
    }

    const isApplicant = user.id === matching.applicant_id;
    const targetColumn = isApplicant ? 'user1_joined_at' : 'user2_joined_at';
    const alreadyJoined = isApplicant ? matching.user1_joined_at : matching.user2_joined_at;

    if (alreadyJoined === null) {
      await admin
        .from('matchings')
        .update({ [targetColumn]: new Date().toISOString() })
        .eq('id', matchingId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Join error:', error);
    return NextResponse.json({ error: '入室記録処理に失敗しました' }, { status: 500 });
  }
}
