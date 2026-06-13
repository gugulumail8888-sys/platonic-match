import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  // 自分をいいねした人の一覧
  const { data: receivedLikes } = await supabase
    .from('likes')
    .select('liker_id')
    .eq('liked_id', user.id);

  if (!receivedLikes || receivedLikes.length === 0) {
    return NextResponse.json({ members: [] });
  }

  const likerIds = receivedLikes.map((l: { liker_id: string }) => l.liker_id);

  // 自分がいいねした人の一覧（相互いいね判定用）
  const { data: sentLikes } = await supabase
    .from('likes')
    .select('liked_id')
    .eq('liker_id', user.id);

  const sentIds = new Set((sentLikes ?? []).map((l: { liked_id: string }) => l.liked_id));

  // プロフィール取得
  const { data: members } = await supabase
    .from('profiles')
    .select('id, nickname, birth_date, prefecture')
    .in('id', likerIds);

  const result = (members ?? []).map((m) => ({
    ...m,
    isMutual: sentIds.has(m.id),
  }));

  return NextResponse.json({ members: result });
}
