import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const matchingId = req.nextUrl.searchParams.get('matchingId');
  if (!matchingId) {
    return NextResponse.json({ error: 'matchingIdが必要です' }, { status: 400 });
  }

  const { data: matching } = await supabase
    .from('matchings')
    .select('payment_intent_id, applicant_id, partner_id')
    .eq('id', matchingId)
    .single();

  if (!matching) {
    return NextResponse.json({ error: 'お見合いが見つかりません' }, { status: 404 });
  }

  // 申請者・お相手のどちらかであることを確認
  if (matching.applicant_id !== user.id && matching.partner_id !== user.id) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  return NextResponse.json({ isPaid: !!matching.payment_intent_id });
}
