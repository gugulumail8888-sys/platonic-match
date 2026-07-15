import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const DEFAULT_DAILY_LIKE_LIMIT = 10;

async function getDailyLikeLimit(): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('settings')
    .select('value')
    .eq('key', 'daily_like_limit')
    .maybeSingle();

  const value = Number(data?.value);
  return value > 0 ? value : DEFAULT_DAILY_LIKE_LIMIT;
}

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const dailyLikeLimit = await getDailyLikeLimit();

  const { data: likes } = await supabase
    .from('likes')
    .select('liked_id')
    .eq('liker_id', user.id);

  if (!likes || likes.length === 0) return NextResponse.json({ liked: [], members: [], remainingToday: dailyLikeLimit });

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

  const remainingToday = Math.max(0, dailyLikeLimit - (count ?? 0));

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

  // 1日あたりのいいね上限チェック
  const dailyLikeLimit = await getDailyLikeLimit();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('liker_id', user.id)
    .gte('created_at', today.toISOString());

  if ((count ?? 0) >= dailyLikeLimit) {
    return NextResponse.json(
      { error: `1日のいいね上限（${dailyLikeLimit}件）に達しました。明日またお試しください。` },
      { status: 429 }
    );
  }

  await supabase.from('likes').insert({ liker_id: user.id, liked_id: memberId });

  return NextResponse.json({
    liked: true,
    remainingToday: dailyLikeLimit - (count ?? 0) - 1,
  });
}
