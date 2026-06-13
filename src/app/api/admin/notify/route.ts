import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// ============================================================
// 管理者通知 API
// Resend を使い、新しいお見合い申請を管理者にメール通知する
// ============================================================

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      applicationId: string;
      appliedAt: string;
      applicant: {
        nickname: string;
        age: number;
        prefecture: string;
        occupation: string;
      };
      member: {
        nickname: string;
        age: number;
        prefecture: string;
        occupation: string;
      };
      amount: number;
      aiCompatibilityComment?: string;
    };

    const {
      applicationId, appliedAt, applicant, member, amount, aiCompatibilityComment,
    } = body;

    const subject = `【amista】新しいお見合い申請が届きました（${applicationId}）`;

    const { error } = await resend.emails.send({
      from: 'amista <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL ?? 'admin@amista.jp',
      subject,
      html: `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"></head><body><div style="font-family: sans-serif; font-size: 14px; line-height: 1.8;">
        <h2 style="color: #0d9488;">【amista】新しいお見合い申請が届きました</h2>
        <h3>申請詳細</h3>
        <p>申請番号：${applicationId}<br>
        申請日時：${new Date(appliedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}<br>
        料金：¥${amount.toLocaleString()}（税込）</p>
        <h3>申請者情報</h3>
        <p>ニックネーム：${applicant.nickname}<br>
        年齢：${applicant.age}歳<br>
        居住地：${applicant.prefecture}<br>
        職業：${applicant.occupation}</p>
        <h3>お相手情報</h3>
        <p>ニックネーム：${member.nickname}<br>
        年齢：${member.age}歳<br>
        居住地：${member.prefecture}<br>
        職業：${member.occupation}</p>
        ${aiCompatibilityComment ? `<h3>AI相性コメント</h3><p>${aiCompatibilityComment}</p>` : ''}
        <hr>
        <p style="color: #888; font-size: 12px;">このメールはamistaシステムから自動送信されています。</p>
      </div></body></html>`,
    });

    if (error) {
      console.error('Admin notify mail error:', error);
      return NextResponse.json(
        { error: '管理者通知メールの送信に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin notify error:', error);
    return NextResponse.json(
      { error: '管理者通知に失敗しました' },
      { status: 500 }
    );
  }
}
