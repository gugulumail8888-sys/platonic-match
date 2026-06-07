import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { data } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', user.id);

  return NextResponse.json({
    blocked: (data ?? []).map((r: { blocked_id: string }) => r.blocked_id),
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { memberId } = (await req.json()) as { memberId: string };

  const { data: existing } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', user.id)
    .eq('blocked_id', memberId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', memberId);
    return NextResponse.json({ blocked: false });
  }

  await supabase
    .from('blocks')
    .insert({ blocker_id: user.id, blocked_id: memberId });
  return NextResponse.json({ blocked: true });
}
