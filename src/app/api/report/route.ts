import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

    const { applicationId, category, categoryLabel, nickname, detail } = await req.json() as {
      applicationId?: string;
      category?: string;
      categoryLabel?: string;
      nickname?: string;
      detail?: string;
    };

    if (!category) {
      return NextResponse.json({ error: '通報の種類を選択してください' }, { status: 400 });
    }

    const admin = createAdminClient();

    let matchingId: string | null = null;
    let reportedId: string | null = null;

    if (applicationId) {
      const { data: matching } = await admin
        .from('matchings')
        .select('id, applicant_id, partner_id')
        .eq('id', applicationId)
        .maybeSingle();

      if (matching && (matching.applicant_id === user.id || matching.partner_id === user.id)) {
        matchingId = matching.id;
        reportedId = matching.applicant_id === user.id ? matching.partner_id : matching.applicant_id;
      }
    }

    const { error: insertError } = await admin.from('reports').insert({
      matching_id: matchingId,
      reporter_id: user.id,
      reported_id: reportedId,
      reported_nickname: nickname ?? null,
      category,
      detail: detail ?? null,
    });

    if (insertError) {
      console.error('report insert error:', insertError);
      return NextResponse.json({ error: '通報の送信に失敗しました' }, { status: 500 });
    }

    const { data: reporterProfile } = await admin
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .maybeSingle();

    await fetch(`${req.nextUrl.origin}/api/admin/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
      },
      body: JSON.stringify({
        type: 'user_reported',
        applicationId: applicationId ?? '（申請番号なし）',
        reporterNickname: reporterProfile?.nickname ?? '不明',
        reportedNickname: nickname ?? '不明',
        reportCategory: categoryLabel ?? category,
        reportDetail: detail ?? '',
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Report submit error:', error);
    return NextResponse.json({ error: '通報の送信に失敗しました' }, { status: 500 });
  }
}
