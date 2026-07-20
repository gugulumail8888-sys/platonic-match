import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { isCampaignActive } from '@/lib/campaign';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { priceId: requestedPriceId } = (await req.json().catch(() => ({}))) as { priceId?: string };
  const priceId = requestedPriceId ?? process.env.STRIPE_PRICE_STANDARD;

  if (!priceId || !/^price_[a-zA-Z0-9]+$/.test(priceId)) {
    return NextResponse.json({ error: '決済プランが未設定です。しばらくしてから再度お試しください' }, { status: 503 });
  }

  const couponId = process.env.STRIPE_CAMPAIGN_COUPON_ID;
  // キャンペーンが終了している場合はクーポンを適用せず、通常価格で申込みを進める(申込み自体は拒否しない)
  const campaignActive = !!couponId && await isCampaignActive(supabase, createAdminClient());

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      success_url: `${SITE_URL}/payment/success`,
      cancel_url: `${SITE_URL}/payment/cancel`,
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
      ...(campaignActive && couponId ? {
        discounts: [{ coupon: couponId }],
      } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : '決済セッションの作成に失敗しました';
    console.error('Stripe checkout error:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
