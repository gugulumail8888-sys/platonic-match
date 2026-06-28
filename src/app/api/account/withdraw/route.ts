import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const admin = createAdminClient();

  // Stripe サブスクリプションのキャンセル
  const { data: profile } = await admin
    .from('profiles')
    .select('is_premium, stripe_subscription_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.is_premium && profile.stripe_subscription_id) {
    const stripe = getStripe();
    await stripe.subscriptions.cancel(profile.stripe_subscription_id);
  }

  const { error } = await admin
    .from('profiles')
    .update({
      status: 'withdrawn',
      withdrawn_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // auth.users は削除しない（3ヶ月後に別途バッチ削除）
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
