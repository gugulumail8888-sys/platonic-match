import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { matchingId } = await req.json();
  if (!matchingId) return NextResponse.json({ error: 'matchingIdが必要です' }, { status: 400 });

  const adminSupabase = createAdminClient();

  // マッチング情報を取得
  const { data: matching } = await adminSupabase
    .from('matchings')
    .select('id, applicant_id, partner_id, payment_intent_id, partner_payment_intent_id, status, scheduled_at')
    .eq('id', matchingId)
    .single();

  if (!matching) return NextResponse.json({ error: 'マッチングが見つかりません' }, { status: 404 });

  let role: 'applicant' | 'partner';
  if (matching.applicant_id === user.id) {
    role = 'applicant';
  } else if (matching.partner_id === user.id) {
    role = 'partner';
  } else {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  if (!matching.scheduled_at) return NextResponse.json({ error: '日程が確定していません' }, { status: 400 });

  const alreadyPaid = role === 'applicant' ? !!matching.payment_intent_id : !!matching.partner_payment_intent_id;
  if (alreadyPaid) return NextResponse.json({ error: 'すでにお支払い済みです' }, { status: 400 });

  // 支払う本人自身のプランに応じた金額を計算
  const { data: myProfile } = await adminSupabase
    .from('profiles')
    .select('is_premium')
    .eq('id', user.id)
    .single();
  const amount = myProfile?.is_premium ? 3000 : 3500;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Stripe Checkoutセッション作成（一回払い）
  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: 'お見合い料',
            description: `お見合い日程：${new Date(matching.scheduled_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/payment/omiai/success?matchingId=${matchingId}`,
    cancel_url: `${appUrl}/matching`,
    metadata: {
      matchingId,
      userId: user.id,
      type: 'omiai_fee',
      role,
    },
  });

  return NextResponse.json({ url: session.url });
}
