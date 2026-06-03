import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const sb = createClient(
    process.env.BLOCKS_SUPABASE_URL!,
    process.env.BLOCKS_SERVICE_ROLE_KEY!
  );

  const { data } = await sb.from('blocks').select('blocked_member_id');

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { blocked_member_id: number }[]) {
    const key = String(row.blocked_member_id);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return NextResponse.json({ counts });
}
