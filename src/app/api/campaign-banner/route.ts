import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const start = new Date('2026-07-01T00:00:00+09:00');
    const end = new Date('2026-09-30T23:59:59+09:00');
    active = now >= start && now <= end;
  }

  return NextResponse.json({ active });
}
