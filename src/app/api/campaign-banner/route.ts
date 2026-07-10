import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CAMPAIGN_START, CAMPAIGN_END } from '@/lib/campaign';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'campaign_banner_enabled')
    .maybeSingle();

  let active = false;
  if (data?.value === 'true') {
    const now = new Date();
    active = now >= CAMPAIGN_START && now <= CAMPAIGN_END;
  }

  return NextResponse.json({ active });
}
