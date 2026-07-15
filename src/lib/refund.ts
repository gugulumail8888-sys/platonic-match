import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * 指定したmatchingの申請者またはお相手へ、支払い済みのお見合い料を全額返金する。
 * 未入金の場合・既に返金済みの場合は何もせずfalseを返す。
 */
export async function refundOmiaiPayment(
  admin: AdminClient,
  matchingId: string,
  side: 'applicant' | 'partner',
  reason: string
): Promise<boolean> {
  const { data: matching } = await admin
    .from('matchings')
    .select('applicant_id, partner_id, amount, partner_amount, payment_intent_id, partner_payment_intent_id, refunded, partner_refunded')
    .eq('id', matchingId)
    .maybeSingle();

  if (!matching) return false;

  const paymentIntentId = side === 'applicant' ? matching.payment_intent_id : matching.partner_payment_intent_id;
  const refundAmount = side === 'applicant' ? matching.amount : matching.partner_amount;
  const alreadyRefunded = side === 'applicant' ? matching.refunded : matching.partner_refunded;
  const refundToUserId = side === 'applicant' ? matching.applicant_id : matching.partner_id;
  const cancelledByUserId = side === 'applicant' ? matching.partner_id : matching.applicant_id;

  if (!paymentIntentId || !refundAmount || alreadyRefunded) return false;

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmount,
    });

    await admin
      .from('refunds')
      .insert({
        schedule_id: matchingId,
        refund_to_user_id: refundToUserId,
        cancelled_by_user_id: cancelledByUserId,
        stripe_payment_intent_id: paymentIntentId,
        stripe_refund_id: refund.id,
        amount: refundAmount,
        status: refund.status,
        reason,
      });

    await admin
      .from('matchings')
      .update(side === 'applicant' ? { refunded: true } : { partner_refunded: true })
      .eq('id', matchingId);

    return true;
  } catch (err) {
    console.error(`refundOmiaiPayment error (matching ${matchingId}, side ${side}):`, err);
    return false;
  }
}
