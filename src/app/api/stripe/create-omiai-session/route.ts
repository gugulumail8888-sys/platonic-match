import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const OMIAI_FEE = 3000; // お見合い料（円）

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { matchingId } = (await req.json()) as { matchingId: string };
  if (!matchingId) {
    return NextResponse.json({ error: 'matchingIdが必要です' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            unit_amount: OMIAI_FEE,
            product_data: {
              name: 'ZOOMお見合い料',
              description: 'amistaのZOOMお見合いに参加するための料金です',
            },
          },
          quantity: 1,
        },
      ],
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        matchingId,
        type: 'omiai_fee',
      },
      customer_email: user.email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/schedule/complete?payment=success&id=${matchingId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/schedule/complete?payment=cancel&id=${matchingId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : '決済セッションの作成に失敗しました';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
