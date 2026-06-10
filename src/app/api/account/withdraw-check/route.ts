import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// オプション有効期限（開始日 + 1ヶ月 - 1日）までの残り日数を計算
function calcOptionDaysRemaining(startedAt: string): number {
  const start = new Date(startedAt);
  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + 1);
  expiry.setDate(expiry.getDate() - 1);

  const diffMs = expiry.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const admin = createAdminClient();

  // ① オプション契約中チェック
  const { data: profile } = await admin
    .from('profiles')
    .select('is_premium, stripe_subscription_id, subscription_started_at')
    .eq('id', user.id)
    .maybeSingle();

  let optionDaysRemaining: number | null = null;
  if (profile?.is_premium && profile.stripe_subscription_id && profile.subscription_started_at) {
    const days = calcOptionDaysRemaining(profile.subscription_started_at);
    if (days > 0) optionDaysRemaining = days;
  }

  // ② お見合い申請中チェック（自分が申請している）
  const { data: sentRows } = await supabase
    .from('matchings')
    .select('id')
    .eq('applicant_id', user.id)
    .in('status', ['pending', 'scheduling', 'zoom_completed']);

  const hasSentPending = (sentRows?.length ?? 0) > 0;

  // ③ お見合い申請受信チェック（相手から来ている）
  const { data: receivedRows } = await supabase
    .from('matchings')
    .select('id')
    .eq('partner_id', user.id)
    .eq('status', 'pending');

  const receivedPendingCount = receivedRows?.length ?? 0;

  return NextResponse.json({
    optionDaysRemaining,
    hasSentPending,
    receivedPendingCount,
  });
}
