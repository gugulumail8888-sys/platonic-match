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

// 相互いいねを検出し、未作成であればマッチングを自動生成する
async function tryCreateMutualMatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  likerId: string,
  likedId: string,
  origin: string
): Promise<boolean> {
  try {
    const { data: reciprocal } = await supabase
      .from('likes')
      .select('id')
      .eq('liker_id', likedId)
      .eq('liked_id', likerId)
      .maybeSingle();

    if (!reciprocal) return false;

    const admin = createAdminClient();

    const { data: existingMatching } = await admin
      .from('matchings')
      .select('id')
      .or(
        `and(applicant_id.eq.${likerId},partner_id.eq.${likedId}),and(applicant_id.eq.${likedId},partner_id.eq.${likerId})`
      )
      .maybeSingle();

    if (existingMatching) return false;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: newMatching, error: insertError } = await admin
      .from('matchings')
      .insert({
        applicant_id: likerId,
        partner_id: likedId,
        status: 'scheduling',
        applied_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Mutual match insert error:', insertError);
      return false;
    }

    // マッチング成立メール送信（失敗してもマッチング作成自体は成功扱い）
    try {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, nickname, birth_date, prefecture, occupation')
        .in('id', [likerId, likedId]);

      const profLiker = profiles?.find((p) => p.id === likerId);
      const profLiked = profiles?.find((p) => p.id === likedId);

      const [{ data: authLiker }, { data: authLiked }] = await Promise.all([
        admin.auth.admin.getUserById(likerId),
        admin.auth.admin.getUserById(likedId),
      ]);

      await fetch(`${origin}/api/admin/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'matching_approved',
          applicationId: newMatching?.id ?? '',
          appliedAt: now.toISOString(),
          applicant: {
            nickname: profLiker?.nickname ?? '',
            age: calcAge(profLiker?.birth_date ?? '2000-01-01'),
            prefecture: profLiker?.prefecture ?? '',
            occupation: profLiker?.occupation ?? '',
            email: authLiker?.user?.email ?? '',
          },
          member: {
            nickname: profLiked?.nickname ?? '',
            age: calcAge(profLiked?.birth_date ?? '2000-01-01'),
            prefecture: profLiked?.prefecture ?? '',
            occupation: profLiked?.occupation ?? '',
            email: authLiked?.user?.email ?? '',
          },
          amount: 0,
        }),
      });
    } catch (mailError) {
      console.error('Mutual match notify error:', mailError);
    }

    return true;
  } catch (error) {
    console.error('Mutual match check error:', error);
    return false;
  }
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

  const mutualMatch = await tryCreateMutualMatch(supabase, user.id, memberId, req.nextUrl.origin);

  return NextResponse.json({
    liked: true,
    remainingToday: dailyLikeLimit - (count ?? 0) - 1,
    ...(mutualMatch ? { mutualMatch: true } : {}),
  });
}
