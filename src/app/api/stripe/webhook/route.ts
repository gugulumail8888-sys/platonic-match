import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const PLAN_BY_PRICE_ID: Record<string, string> = {
  [process.env.STRIPE_PRICE_LIGHT ?? '']: 'light',
  [process.env.STRIPE_PRICE_STANDARD ?? '']: 'standard',
};

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

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
        .eq('id', userId);
    }

    const matchingId = session.metadata?.matchingId;
    const type = session.metadata?.type;

    if (type === 'omiai_fee' && matchingId && userId) {
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

      const supabase = createAdminClient();
      const { data: matching, error: matchingUpdateError } = await supabase
        .from('matchings')
        .update({ payment_intent_id: paymentIntentId })
        .eq('id', matchingId)
        .select('applicant_id, partner_id, applied_at, amount')
        .single();

      if (matchingUpdateError) {
        console.error('omiai_fee matching update error:', matchingUpdateError);
      } else if (matching) {
        try {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nickname, birth_date, prefecture, occupation')
            .in('id', [matching.applicant_id, matching.partner_id]);

          const profApplicant = profiles?.find((p) => p.id === matching.applicant_id);
          const profPartner = profiles?.find((p) => p.id === matching.partner_id);

          const [{ data: authApplicant }, { data: authPartner }] = await Promise.all([
            supabase.auth.admin.getUserById(matching.applicant_id),
            supabase.auth.admin.getUserById(matching.partner_id),
          ]);

          await fetch(`${req.nextUrl.origin}/api/admin/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'matching_approved',
              applicationId: matchingId,
              appliedAt: matching.applied_at ?? new Date().toISOString(),
              applicant: {
                nickname: profApplicant?.nickname ?? '',
                age: calcAge(profApplicant?.birth_date ?? '2000-01-01'),
                prefecture: profApplicant?.prefecture ?? '',
                occupation: profApplicant?.occupation ?? '',
                email: authApplicant?.user?.email ?? '',
              },
              member: {
                nickname: profPartner?.nickname ?? '',
                age: calcAge(profPartner?.birth_date ?? '2000-01-01'),
                prefecture: profPartner?.prefecture ?? '',
                occupation: profPartner?.occupation ?? '',
                email: authPartner?.user?.email ?? '',
              },
              amount: matching.amount ?? 0,
            }),
          });
        } catch (notifyError) {
          console.error('omiai_fee notify error:', notifyError);
        }
      }
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    let userId = subscription.metadata?.userId;

    const supabase = createAdminClient();

    if (!userId) {
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
      if (customerId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();
        userId = profile?.id;
      }
    }

    if (userId) {
      const { error: cancelError } = await supabase
        .from('profiles')
        .update({ is_premium: false, subscription_status: 'cancelled' })
        .eq('id', userId);

      if (cancelError) {
        console.error('subscription cancel update error:', cancelError);
      }
    }
  }

  return NextResponse.json({ received: true });
}
