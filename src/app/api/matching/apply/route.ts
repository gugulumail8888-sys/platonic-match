import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

// ============================================================
// デモモード判定
// ============================================================

function isDemoMode(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !key || key === 'your_api_key_here';
}

// ============================================================
// 申請番号生成
// ============================================================

function generateApplicationId(): string {
  const num = Math.floor(Math.random() * 900) + 100; // 100-999
  return `APP-${num}`;
}

// ============================================================
// Route Handler
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      applicant: {
        nickname: string;
        age: number;
        prefecture: string;
        occupation: string;
        hobbies: string;
        pr: string;
      };
      member: {
        id: number;
        nickname: string;
        age: number;
        prefecture: string;
        occupation: string;
      };
      amount: number;
    };

    const { applicant, member, amount } = body;
    const applicationId = generateApplicationId();
    const appliedAt = new Date().toISOString();

    let notifyMessage: string;
    let isDemo: boolean;

    // ── デモモード: テンプレート通知文 ──
    if (isDemoMode()) {
      notifyMessage =
        `${applicant.nickname}さんからお見合い申請が届きました。` +
        `${applicant.age}歳・${applicant.prefecture}在住の${applicant.occupation}の方です。` +
        `ぜひプロフィールをご確認いただき、ご返答をお待ちしています。` +
        `素敵なご縁になりますように。`;
      isDemo = true;
    } else {
      // ── 本番: Anthropic API で通知文を生成 ──
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `あなたは友情婚活マッチングサービス「amista」の通知メッセージライターです。
以下の情報を元に、受け取り側（${member.nickname}さん）への温かみのある通知メッセージを日本語で作成してください。
${applicant.nickname}さんからお見合い申請が届いたことを伝える内容で、約200文字にしてください。

【申請者（${applicant.nickname}さん）】
年齢: ${applicant.age}歳 / 居住地: ${applicant.prefecture} / 職業: ${applicant.occupation}
趣味: ${applicant.hobbies}
自己PR: ${applicant.pr}

【受け取り側（${member.nickname}さん）】
年齢: ${member.age}歳 / 居住地: ${member.prefecture} / 職業: ${member.occupation}

メッセージ本文のみ出力してください。前置きや説明は不要です。`,
          },
        ],
      });
      notifyMessage =
        response.content[0].type === 'text' ? response.content[0].text : '';
      isDemo = false;
    }

    // ── 管理者通知ログ ──
    // TODO: 本番環境では SendGrid や Resend でメール送信する
    console.log(
      '\n========== [管理者通知] お見合い申請 ==========',
      JSON.stringify(
        {
          applicationId,
          appliedAt,
          applicant: { nickname: applicant.nickname, age: applicant.age, prefecture: applicant.prefecture, occupation: applicant.occupation },
          member:    { nickname: member.nickname,    age: member.age,    prefecture: member.prefecture,    occupation: member.occupation },
          amount,
          isDemo,
        },
        null,
        2
      ),
      '\n===============================================\n'
    );

    // ── 管理者通知 API に転送 (fire-and-forget) ──
    // 本番環境では管理者向けメール通知も送信する
    // fetch('/api/admin/notify', { method: 'POST', ... }) は循環参照になるため、
    // ここではログ出力のみ行い、admin/notify は独立した外部呼び出し用エンドポイントとして提供

    return NextResponse.json({
      success: true,
      applicationId,
      notifyMessage,
      isDemo,
    });
  } catch (error) {
    console.error('Apply error:', error);
    return NextResponse.json(
      { error: 'お見合い申請に失敗しました' },
      { status: 500 }
    );
  }
}
