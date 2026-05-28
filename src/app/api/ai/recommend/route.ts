import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

// ============================================================
// デモモード判定（APIキー未設定 or プレースホルダーの場合）
// ============================================================

function isDemoMode(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !key || key === 'your_api_key_here';
}

// ============================================================
// デモ用ダミーデータ
// ============================================================

const DEMO_REASONS = [
  '居住地が近く生活リズムが合いそうです。日常を共有しやすい距離感が魅力です。',
  '結婚希望時期と子供への希望が一致しており、将来設計がよくマッチしています。',
  '趣味の傾向が近く、休日を一緒に楽しめるシーンが多く想像できます。',
  '価値観と将来への考え方が近く、安定したパートナーシップが期待できます。',
  '誠実で家庭的な姿勢が感じられ、長期的な関係を築きやすいと思います。',
  '職業柄の安定感と生活スタイルの相性が良く、穏やかな日常が築けそうです。',
  'お互いの希望条件が合致しており、自然な形で関係を深められそうです。',
];

function demoCandidates(candidates: { id: number }[]) {
  return candidates.map((c) => ({
    id: c.id,
    // 70〜95 のランダムスコア
    score: Math.floor(Math.random() * 26) + 70,
    reason: DEMO_REASONS[c.id % DEMO_REASONS.length],
  }));
}

// ============================================================
// Types
// ============================================================

interface CandidateScore {
  id: number;
  score: number;
  reason: string;
}

interface ProfileSummary {
  nickname: string;
  age: number;
  prefecture: string;
  occupation: string;
  hobbies: string;
  marriageTiming: string;
  childrenDesire: string;
  desiredConditions: string;
}

interface CandidateSummary extends ProfileSummary {
  id: number;
}

// ============================================================
// Route Handler
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      myProfile: ProfileSummary;
      candidates: CandidateSummary[];
    };

    const { myProfile, candidates } = body;

    // ── デモモード: ランダムスコアで返す ──
    if (isDemoMode()) {
      return NextResponse.json({
        candidates: demoCandidates(candidates),
        isDemo: true,
      });
    }

    // ── 本番: Anthropic API を直接呼び出す ──
    const candidatesText = candidates
      .map(
        (c) =>
          `ID:${c.id} / ${c.nickname} / ${c.age}歳 / ${c.prefecture} / ${c.occupation}` +
          ` / 趣味:${c.hobbies.substring(0, 40)}` +
          ` / 結婚希望:${c.marriageTiming}` +
          ` / 子供希望:${c.childrenDesire}` +
          ` / 希望条件:${c.desiredConditions.substring(0, 50)}`
      )
      .join('\n');

    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 2048,
        thinking: { type: 'enabled', budget_tokens: 1024 },
        messages: [
          {
            role: 'user',
            content: `あなたは友情婚活マッチングサービス「amista」のAIマッチングアドバイザーです。
ユーザーのプロフィールと候補者リストを詳しく分析して、各候補者との相性スコア（0〜100）と
100文字以内の具体的な理由を日本語で提示してください。

友情婚活とは、恋愛感情なしに生活パートナーを求めるマッチングサービスです。
価値観・生活スタイル・将来設計の合致度を重視してスコアを算出してください。

【ユーザープロフィール】
${myProfile.nickname} / ${myProfile.age}歳 / ${myProfile.prefecture} / ${myProfile.occupation}
趣味: ${myProfile.hobbies}
結婚希望時期: ${myProfile.marriageTiming} / 子供希望: ${myProfile.childrenDesire}
希望条件: ${myProfile.desiredConditions}

【候補者リスト】
${candidatesText}

以下のJSON形式のみで回答してください。前置きや説明テキストは一切不要です：
{
  "candidates": [
    {"id": 候補者ID, "score": スコア(0-100の整数), "reason": "理由(100文字以内の日本語)"}
  ]
}`,
          },
        ],
      }),
    });

    if (!apiResponse.ok) {
      const errBody = await apiResponse.text();
      console.error('Anthropic API error:', apiResponse.status, errBody);
      throw new Error(`Anthropic API returned ${apiResponse.status}`);
    }

    const data = await apiResponse.json() as {
      content: { type: string; text?: string }[];
    };

    const text = data.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('');

    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      console.error('No JSON found in response:', text);
      throw new Error('AIからの応答にJSONが含まれていませんでした');
    }

    const result = JSON.parse(match[0]) as { candidates: CandidateScore[] };

    return NextResponse.json({ ...result, isDemo: false });
  } catch (error) {
    console.error('AI recommend error:', error);
    return NextResponse.json(
      { error: 'AIレコメンドの生成に失敗しました' },
      { status: 500 }
    );
  }
}
