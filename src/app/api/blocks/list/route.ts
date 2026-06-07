import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { data: blocks } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', user.id);

  if (!blocks || blocks.length === 0) return NextResponse.json({ members: [] });

  const blockedIds = blocks.map((b) => b.blocked_id);

  const { data: members } = await supabase
    .from('profiles')
    .select('id, nickname, prefecture, occupation, birth_date')
    .in('id', blockedIds);

  return NextResponse.json({ members: members ?? [] });
}
