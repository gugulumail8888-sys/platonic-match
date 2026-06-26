import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'omiai_open')
    .single();

  return NextResponse.json({ omiai_open: data?.value === 'true' });
}
