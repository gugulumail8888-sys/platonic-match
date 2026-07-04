import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sb = createAdminClient();

  const { data, error } = await sb.from('blocks').select('blocked_id');

  if (error) {
    console.error('[blocks/counts] failed to fetch blocks:', error);
    return NextResponse.json({ counts: {} });
  }

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { blocked_id: string }[]) {
    const key = row.blocked_id;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return NextResponse.json({ counts });
}
