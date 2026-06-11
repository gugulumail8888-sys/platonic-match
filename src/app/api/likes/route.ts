import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const DAILY_LIKE_LIMIT = 10;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { data: likes } = await supabase
    .from('likes')
    .select('liked_id')
    .eq('liker_id', user.id);

  if (!likes || likes.length === 0) return NextResponse.json({ liked: [], members: [], remainingToday: DAILY_LIKE_LIMIT });

  const likedIds = likes.map((l: { liked_id: string }) => l.liked_id);

  const { data: members } = await supabase
    .from('profiles')
    .select('id, nickname, birth_date, prefecture')
    .in('id', likedIds);

  // 今日送ったいいね数を取得
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('liker_id', user.id)
    .gte('created_at', today.toISOString());

  const remainingToday = Math.max(0, DAILY_LIKE_LIMIT - (count ?? 0));

  return NextResponse.json({ liked: likedIds, members: members ?? [], remainingToday });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { memberId } = (await req.json()) as { memberId: string };

  // 既存のいいねチェック（取り消しの場合は制限不要）
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

  // 1日10件制限チェック
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('liker_id', user.id)
    .gte('created_at', today.toISOString());

  if ((count ?? 0) >= DAILY_LIKE_LIMIT) {
    return NextResponse.json(
      { error: `1日のいいね上限（${DAILY_LIKE_LIMIT}件）に達しました。明日またお試しください。` },
      { status: 429 }
    );
  }

  await supabase.from('likes').insert({ liker_id: user.id, liked_id: memberId });
  return NextResponse.json({ liked: true, remainingToday: DAILY_LIKE_LIMIT - (count ?? 0) - 1 });
}
