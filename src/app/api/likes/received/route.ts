import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { data: likes } = await supabase
    .from('likes')
    .select('liker_id')
    .eq('liked_id', user.id);

  if (!likes || likes.length === 0) return NextResponse.json({ members: [] });

  const likerIds = likes.map((l: { liker_id: string }) => l.liker_id);

  const { data: members } = await supabase
    .from('profiles')
    .select('id, nickname, birth_date, prefecture')
    .in('id', likerIds);

  return NextResponse.json({ members: members ?? [] });
}
