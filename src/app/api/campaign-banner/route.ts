import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { CAMPAIGN_SLOT_LIMIT, getCampaignPeriod, getCampaignPeriodLabel, isCampaignActive } from '@/lib/campaign';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'campaign_banner_enabled')
    .maybeSingle();

  const { start, end } = await getCampaignPeriod(supabase);
  const now = new Date();
  const bannerEnabled = data?.value === 'true';
  const withinPeriod = now >= start && now <= end;

  const active = await isCampaignActive(supabase, admin);
  // 先着200名到達で自動的にバナーを非表示にする(タスク#23対応・2026/7/15)。
  // banner_enabledかつ期間内なのにactiveがfalseなら、原因は上限人数到達しかありえない。
  const capReached = bannerEnabled && withinPeriod && !active;

  return NextResponse.json({ active, capReached, periodLabel: getCampaignPeriodLabel(start, end), slotLimit: CAMPAIGN_SLOT_LIMIT });
}
