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
// Route Handler
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      requester: {
        nickname: string;
        age: number;
        prefecture: string;
        occupation: string;
        hobbies: string;
        pr: string;
      };
      receiver: {
        nickname: string;
        age: number;
        prefecture: string;
        occupation: string;
      };
    };

    const { requester, receiver } = body;

    // ── デモモード: テンプレートで返す ──
    if (isDemoMode()) {
      const message =
        `${requester.nickname}さんからお見合い申請が届きました。` +
        `${requester.age}歳・${requester.prefecture}在住の${requester.occupation}の方です。` +
        `ぜひプロフィールをご確認いただき、ご返答をお待ちしています。` +
        `素敵なご縁になりますように。`;
      return NextResponse.json({ message, isDemo: true });
    }

    // ── 本番: Anthropic API を直接呼び出す ──
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `あなたは友情婚活マッチングサービス「amista」の通知メッセージライターです。
以下の情報を元に、受け取り側（${receiver.nickname}さん）への温かみのある通知メッセージを日本語で作成してください。
${requester.nickname}さんからお見合い申請が届いたことを伝える内容で、約200文字にしてください。
丁寧かつ親しみやすいトーンで書いてください。

【申請者（${requester.nickname}さん）の情報】
年齢: ${requester.age}歳 / 居住地: ${requester.prefecture} / 職業: ${requester.occupation}
趣味: ${requester.hobbies}
自己PR: ${requester.pr}

【受け取り側（${receiver.nickname}さん）の情報】
年齢: ${receiver.age}歳 / 居住地: ${receiver.prefecture} / 職業: ${receiver.occupation}

メッセージ本文のみ出力してください。前置きや説明は不要です。`,
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

    const message =
      data.content[0].type === 'text' ? (data.content[0].text ?? '') : '';

    return NextResponse.json({ message, isDemo: false });
  } catch (error) {
    console.error('AI notify error:', error);
    return NextResponse.json(
      { error: 'AI通知メッセージの生成に失敗しました' },
      { status: 500 }
    );
  }
}
