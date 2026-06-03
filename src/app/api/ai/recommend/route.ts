import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

const AVATAR_COLORS = [
  '#0d9488','#7c3aed','#db2777','#ea580c','#16a34a',
  '#2563eb','#d97706','#dc2626','#0891b2','#65a30d',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function calcAge(birthDate: string | null): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

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
    const { data: candidates } = await supabase
      .from('profiles')
      .select('*')
      .eq('gender', oppositeGender)
      .eq('status', 'active')
      .neq('id', user.id)
      .not('id', 'in', `(${blockedIds.length > 0 ? blockedIds.join(',') : 'null'})`);


    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ candidates: [], isDemo: true });
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
      return NextResponse.json({ candidates: results, isDemo: true });
    }

    // 本番AIモード
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `以下のユーザーと候補者リストの相性を分析してください。
ユーザー: ${JSON.stringify(myProfile)}
候補者: ${JSON.stringify(candidates)}
各候補者に対して0-100のスコアと理由を日本語で返してください。
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
    return NextResponse.json({ candidates: results, isDemo: false });

  } catch (err) {
    console.error('recommend error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
