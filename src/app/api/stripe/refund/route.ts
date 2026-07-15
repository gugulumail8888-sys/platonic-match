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
    .select('applicant_id, partner_id, amount, partner_amount')
    .eq('id', matching_id)
    .maybeSingle();

  if (!matching) {
    return NextResponse.json({ error: 'マッチングが見つかりません' }, { status: 404 });
  }

  const isApplicant = refund_to_user_id === matching.applicant_id;
  const isPartner = refund_to_user_id === matching.partner_id;
  if (!isApplicant && !isPartner) {
    return NextResponse.json({ error: '返金先が不正です' }, { status: 400 });
  }

  const refundAmount = isApplicant ? matching.amount : matching.partner_amount;
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

    await admin
      .from('matchings')
      .update(isApplicant ? { refunded: true } : { partner_refunded: true })
      .eq('id', matching_id);

    // 返金先の会員へ「1営業日以内に返金処理を行います」メールを送信
    // (返金処理自体は既に完了・DB反映済みのため、メール送信の成否はemailSentとして
    //  レスポンスに含め、失敗時は画面側で管理者に気づけるようにする)
    let emailSent = false;
    try {
      const { data: refundedProfile } = await admin
        .from('profiles')
        .select('nickname')
        .eq('id', refund_to_user_id)
        .maybeSingle();
      const { data: refundedAuth } = await admin.auth.admin.getUserById(refund_to_user_id);
      const refundedEmail = refundedAuth?.user?.email;

      if (refundedEmail) {
        const notifyRes = await fetch(`${req.nextUrl.origin}/api/admin/notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            type: 'refund_completed',
            user: { nickname: refundedProfile?.nickname ?? 'ユーザー', email: refundedEmail },
            refundAmount,
          }),
        });
        emailSent = notifyRes.ok;
        if (!notifyRes.ok) {
          console.error('refund_completed notify failed:', notifyRes.status, await notifyRes.text().catch(() => ''));
        }
      } else {
        console.error('refund_completed notify skipped: メールアドレスが取得できませんでした', refund_to_user_id);
      }
    } catch (notifyError) {
      console.error('refund_completed notify error:', notifyError);
    }

    return NextResponse.json({ success: true, refund_id: refund.id, status: refund.status, emailSent });
  } catch (err) {
    console.error('refund error:', err);
    return NextResponse.json({ error: '返金処理に失敗しました' }, { status: 502 });
  }
}
