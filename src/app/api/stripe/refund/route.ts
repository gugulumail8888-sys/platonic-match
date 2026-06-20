import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const { matching_id, refund_to_user_id, cancelled_by_user_id, stripe_payment_intent_id, reason } =
    (await req.json().catch(() => ({}))) as {
      matching_id?: string;
      refund_to_user_id?: string;
      cancelled_by_user_id?: string;
      stripe_payment_intent_id?: string;
      reason?: string;
    };

  if (!matching_id || !refund_to_user_id || !cancelled_by_user_id || !stripe_payment_intent_id) {
    return NextResponse.json({ error: 'パラメータが不足しています' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: matching } = await admin
    .from('matchings')
    .select('amount')
    .eq('id', matching_id)
    .maybeSingle();

  const refundAmount = matching?.amount;
  if (!refundAmount) {
    return NextResponse.json({ error: '返金額が取得できませんでした' }, { status: 400 });
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: stripe_payment_intent_id,
      amount: refundAmount,
    });

    const { error: dbError } = await admin
      .from('refunds')
      .insert({
        schedule_id: matching_id,
        refund_to_user_id,
        cancelled_by_user_id,
        stripe_payment_intent_id,
        stripe_refund_id: refund.id,
        amount: refundAmount,
        status: refund.status,
        reason: reason ?? 'ドタキャンによる返金',
      });

    if (dbError) {
      console.error('refund insert error:', dbError);
      return NextResponse.json({ error: 'DB保存に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true, refund_id: refund.id, status: refund.status });
  } catch (err) {
    console.error('refund error:', err);
    return NextResponse.json({ error: '返金処理に失敗しました' }, { status: 502 });
  }
}
