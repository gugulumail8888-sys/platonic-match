import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_subscription_id, is_premium')
      .eq('id', user.id)
      .single();

    if (!profile?.is_premium || !profile?.stripe_subscription_id) {
      return NextResponse.json({ error: '有効なサブスクリプションが見つかりません' }, { status: 400 });
    }

    // Stripeでサブスクリプションを期間末に解約
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('cancel-subscription error:', error);
    return NextResponse.json({ error: '解約処理に失敗しました' }, { status: 500 });
  }
}
