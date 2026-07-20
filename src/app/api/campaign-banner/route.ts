import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { CAMPAIGN_SLOT_LIMIT, getCampaignPeriod, getCampaignPeriodLabel } from '@/lib/campaign';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'campaign_banner_enabled')
    .maybeSingle();

  const { start, end } = await getCampaignPeriod(supabase);

  let active = false;
  let capReached = false;
  if (data?.value === 'true') {
    const now = new Date();
    const withinPeriod = now >= start && now <= end;
    if (withinPeriod) {
      // 先着200名到達で自動的にバナーを非表示にする(タスク#23対応・2026/7/15)
      const admin = createAdminClient();
      const { count } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('subscription_started_at', start.toISOString())
        .lte('subscription_started_at', end.toISOString());
      capReached = (count ?? 0) >= CAMPAIGN_SLOT_LIMIT;
      active = !capReached;
    }
  }

  return NextResponse.json({ active, capReached, periodLabel: getCampaignPeriodLabel(start, end), slotLimit: CAMPAIGN_SLOT_LIMIT });
}
