// AIおすすめオプション(ai_option_enabled設定)のON/OFF切り替えに連動して、
// 契約中の会員全員のStripeサブスクリプション請求を一時停止/再開するヘルパー。
//
// 背景(2026/7/14、ユーザーと合意):管理画面でAIおすすめオプションをOFFにしても
// Stripe側のサブスクリプション本体には影響しないため、機能を使えないのに毎月
// 課金され続けてしまう問題があった。他のマッチングアプリ(Pairs等)の障害時対応を
// 調査した結果、現金返金ではなく無償で利用期間を延長する対応が一般的だったため、
// Stripeのpause_collection機能(behavior: 'void')を使って一時停止中の請求書を
// 自動的に無効化する方式を採用。pause_collection中はサブスクリプションの期間は
// 進行するが請求は発生しないため、再開時に停止していた日数分がそのまま
// 「無償延長」として作用する(手動での期間計算・DB書き換えは不要)。
import { stripe } from '@/lib/stripe';
import type { createAdminClient } from '@/lib/supabase/server';

type AdminClient = ReturnType<typeof createAdminClient>;

async function getActiveAiOptionSubscriptions(admin: AdminClient) {
  const { data, error } = await admin
    .from('profiles')
    .select('id, stripe_subscription_id')
    .eq('is_premium', true)
    .not('stripe_subscription_id', 'is', null);

  if (error) {
    console.error('AIオプション契約者取得エラー:', error);
    return [];
  }
  return (data ?? []).filter(
    (p): p is { id: string; stripe_subscription_id: string } => !!p.stripe_subscription_id
  );
}

export async function pauseAllAiOptionBilling(admin: AdminClient): Promise<{ paused: number; failed: number }> {
  const targets = await getActiveAiOptionSubscriptions(admin);
  let paused = 0;
  let failed = 0;

  for (const t of targets) {
    try {
      await stripe.subscriptions.update(t.stripe_subscription_id, {
        pause_collection: { behavior: 'void' },
      });
      paused++;
    } catch (e) {
      failed++;
      console.error(`AIオプション請求一時停止エラー(user=${t.id}, sub=${t.stripe_subscription_id}):`, e);
    }
  }

  await admin
    .from('settings')
    .upsert({ key: 'ai_option_paused_at', value: new Date().toISOString() }, { onConflict: 'key' });

  return { paused, failed };
}

export async function resumeAllAiOptionBilling(admin: AdminClient): Promise<{ resumed: number; failed: number }> {
  const targets = await getActiveAiOptionSubscriptions(admin);
  let resumed = 0;
  let failed = 0;

  for (const t of targets) {
    try {
      await stripe.subscriptions.update(t.stripe_subscription_id, {
        pause_collection: '',
      });
      resumed++;
    } catch (e) {
      failed++;
      console.error(`AIオプション請求再開エラー(user=${t.id}, sub=${t.stripe_subscription_id}):`, e);
    }
  }

  await admin
    .from('settings')
    .upsert({ key: 'ai_option_paused_at', value: '' }, { onConflict: 'key' });

  return { resumed, failed };
}
