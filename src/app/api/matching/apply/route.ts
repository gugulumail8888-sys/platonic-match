import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

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
        id: string;
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

    // ── matchingsテーブルに申請を保存 ──
    const adminSupabase = createAdminClient();

    // ── 重複チェック ──
    const { data: existing } = await adminSupabase
      .from('matchings')
      .select('id')
      .eq('applicant_id', user.id)
      .eq('partner_id', member.id)
      .in('status', ['pending', 'scheduling'])
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'すでにお見合い申請中です' }, { status: 400 });
    }

    const { error: insertError } = await adminSupabase.from('matchings').insert({
      applicant_id: user.id,
      partner_id: member.id,
      status: 'pending',
      amount,
      applied_at: appliedAt,
    });

    if (insertError) {
      console.error('Matching insert error:', insertError);
      return NextResponse.json({ error: 'お見合い申請の保存に失敗しました' }, { status: 500 });
    }

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
      const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
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
      notifyMessage =
        data.content[0].type === 'text' ? (data.content[0].text ?? '') : '';
      isDemo = false;
    }

    // ── 申請者・お相手のメールアドレスを取得 ──
    const [{ data: authApplicant }, { data: authMember }] = await Promise.all([
      adminSupabase.auth.admin.getUserById(user.id),
      adminSupabase.auth.admin.getUserById(member.id),
    ]);

    // ── 管理者通知 ──
    await fetch(`${req.nextUrl.origin}/api/admin/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'matching_request',
        applicationId,
        appliedAt,
        applicant: { ...applicant, email: authApplicant?.user?.email ?? '' },
        member: { ...member, email: authMember?.user?.email ?? '' },
        amount,
      }),
    });

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
