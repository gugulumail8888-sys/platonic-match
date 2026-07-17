import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvatarColor, AVATAR_COLORS } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isDemoMode(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !key || key === 'your_api_key_here';
}

const DEMO_REASONS = [
  '居住地が近く生活リズムが合いそうです。日常を共有しやすい距離感が魅力です。',
  '結婚希望時期と子供への希望が一致しており、将来設計がよくマッチしています。',
  '趣味の傾向が近く、休日を一緒に楽しめるシーンが多く想像できます。',
  '価値観と将来への考え方が近く、安定したパートナーシップが期待できます。',
  '誠実で家庭的な姿勢が感じられ、長期的な関係を築きやすいと思います。',
  '職業柄の安定感と生活スタイルの相性が良く、穏やかな日常が築けそうです。',
  'お互いの希望条件が合致しており、自然な形で関係を深められそうです。',
];

function calcAge(birthDate: string | null): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const DAILY_LIMIT = 3;

// JST（日本時間）の「今日」の開始・終了をUTCのDateで返す
function getJstDayRange(): { start: Date; end: Date } {
  const jstDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });
  const start = new Date(`${jstDateStr}T00:00:00+09:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

    const { start, end } = getJstDayRange();
    const { count: usageCount } = await supabase
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());

    const remaining = Math.max(DAILY_LIMIT - (usageCount ?? 0), 0);
    return NextResponse.json({ remaining });
  } catch (err) {
    console.error('recommend usage check error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

    // 1日3回までの利用制限（JST基準）
    const { start, end } = getJstDayRange();
    const { count: usageCount } = await supabase
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());

    if ((usageCount ?? 0) >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: '1日3回までご利用いただけます', limitExceeded: true, remaining: 0 },
        { status: 429 }
      );
    }

    await supabase.from('ai_usage_logs').insert({ user_id: user.id });
    const remaining = Math.max(DAILY_LIMIT - (usageCount ?? 0) - 1, 0);

    // ログインユーザーのプロフィール取得
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // ブロックリスト取得
    const { data: blockedData } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);
    const blockedIds = (blockedData ?? []).map((b: { blocked_id: string }) => b.blocked_id);

    // 候補者取得（異性・アクティブ）
    const oppositeGender = myProfile?.gender === 'male' ? 'female' : 'male';
    let candidatesQuery = supabase
      .from('profiles')
      .select('*')
      .eq('gender', oppositeGender)
      .in('status', ['active', 'approved'])
      .neq('id', user.id);

    if (blockedIds.length > 0) {
      candidatesQuery = candidatesQuery.not('id', 'in', `(${blockedIds.join(',')})`);
    }

    const { data: candidates } = await candidatesQuery;


    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ candidates: [], isDemo: true, remaining });
    }

    // デモモード
    if (isDemoMode()) {
      const results = candidates.map((c, i) => ({
        id: c.id,
        nickname: c.nickname,
        prefecture: c.prefecture,
        occupation: c.occupation,
        age: calcAge(c.birth_date),
        avatarColor: getAvatarColor(c.id),
        initials: c.nickname?.charAt(0) ?? '?',
        score: Math.floor(Math.random() * 26) + 70,
        reason: DEMO_REASONS[i % DEMO_REASONS.length],
      }));
      results.sort((a, b) => b.score - a.score);
      return NextResponse.json({ candidates: results, isDemo: true, remaining });
    }

    // 本番AIモード
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // 聞き取りフォームの回答取得
    const { data: aiPreferences } = await supabase
      .from('ai_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const prompt = `あなたは婚活マッチングサービスのAIアドバイザーです。以下の情報をもとに、ユーザーと各候補者の相性を100点満点で採点してください。

【ユーザーのプロフィール】
${JSON.stringify(myProfile)}

【ユーザーの聞き取り結果（AIおすすめの希望条件）】
${JSON.stringify(aiPreferences)}

【候補者リスト】
${JSON.stringify(candidates)}

【採点基準（合計100点）】
1. 結婚希望時期の一致：25点
2. 子供の希望の一致：20点
3. 外部パートナーの一致：15点
4. 結婚後の居住形態の一致：15点
5. 家計の管理の一致：10点
6. 喫煙・飲酒の相性：5点
7. 趣味・PR・希望条件のテキスト相性分析：10点

聞き取り結果の希望年齢範囲・希望年収・希望居住エリア(preferred_prefectures)・絶対に譲れない条件(must_conditions)・
重視するポイント・一言メッセージも考慮し、絶対に譲れない条件に反する候補者、
希望年収を大きく下回る候補者、希望居住エリアが指定されているのにそれ以外の地域の候補者は
大きく減点してください(希望居住エリアが空の場合は考慮不要)。

各候補者に対してスコア（0-100の整数）と、マッチング理由を日本語50文字程度で返してください。
JSON形式で返答: { "results": [{ "id": "...", "score": 数値, "reason": "..." }] }`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean) as { results: { id: string; score: number; reason: string }[] };

    const results = parsed.results.map((r) => {
      const c = candidates.find((c) => c.id === r.id);
      return {
        id: r.id,
        nickname: c?.nickname ?? '',
        prefecture: c?.prefecture ?? '',
        occupation: c?.occupation ?? '',
        age: calcAge(c?.birth_date ?? null),
        avatarColor: getAvatarColor(r.id),
        initials: c?.nickname?.charAt(0) ?? '?',
        score: r.score,
        reason: r.reason,
      };
    });

    results.sort((a, b) => b.score - a.score);
    return NextResponse.json({ candidates: results, isDemo: false, remaining });

  } catch (err) {
    console.error('recommend error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
