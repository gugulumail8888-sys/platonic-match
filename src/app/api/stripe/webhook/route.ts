import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const PLAN_BY_PRICE_ID: Record<string, string> = {
  [process.env.STRIPE_PRICE_LIGHT ?? '']: 'light',
  [process.env.STRIPE_PRICE_STANDARD ?? '']: 'standard',
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) return NextResponse.json({ error: 'signatureがありません' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'webhook署名の検証に失敗しました' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id ?? session.metadata?.userId;

    if (userId) {
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

      let plan: string | null = null;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        plan = priceId ? PLAN_BY_PRICE_ID[priceId] ?? null : null;
      }

      const supabase = createAdminClient();
      await supabase
        .from('profiles')
        .update({
          stripe_customer_id: customerId ?? null,
          stripe_subscription_id: subscriptionId ?? null,
          subscription_status: 'active',
          subscription_plan: plan,
          subscription_started_at: new Date().toISOString(),
          is_premium: true,
        })
        .eq('user_id', userId);
    }
  }

  return NextResponse.json({ received: true });
}
