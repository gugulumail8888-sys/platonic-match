import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { data: likes } = await supabase
    .from('likes')
    .select('liked_id')
    .eq('liker_id', user.id);

  if (!likes || likes.length === 0) return NextResponse.json({ liked: [], members: [] });

  const likedIds = likes.map((l: { liked_id: string }) => l.liked_id);

  const { data: members } = await supabase
    .from('profiles')
    .select('id, nickname, birth_date, prefecture')
    .in('id', likedIds);

  return NextResponse.json({ liked: likedIds, members: members ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { memberId } = (await req.json()) as { memberId: string };

  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('liker_id', user.id)
    .eq('liked_id', memberId)
    .maybeSingle();

  if (existing) {
    await supabase.from('likes').delete().eq('liker_id', user.id).eq('liked_id', memberId);
    return NextResponse.json({ liked: false });
  }

  await supabase.from('likes').insert({ liker_id: user.id, liked_id: memberId });
  return NextResponse.json({ liked: true });
}
