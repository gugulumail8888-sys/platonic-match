import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// 管理者通知 API（ダミー実装）
// TODO: 本番環境では SendGrid や Resend を使いメールを送信する
//       例: await resend.emails.send({ from: 'noreply@amista.jp', to: 'admin@amista.jp', ... })
// ============================================================

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

    // ── ダミー実装: コンソール出力のみ ──
    // TODO: 本番環境では以下をメール送信に置き換える
    console.log(
      '\n========== [管理者通知メール] ==========\n' +
      `件名: 【amista】新しいお見合い申請が届きました（${applicationId}）\n` +
      '\n--- 申請詳細 ---\n' +
      `申請番号  : ${applicationId}\n` +
      `申請日時  : ${new Date(appliedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\n` +
      `料金      : ¥${amount.toLocaleString()}（税込）\n` +
      '\n--- 申請者情報 ---\n' +
      `ニックネーム: ${applicant.nickname}\n` +
      `年齢        : ${applicant.age}歳\n` +
      `居住地      : ${applicant.prefecture}\n` +
      `職業        : ${applicant.occupation}\n` +
      '\n--- お相手情報 ---\n' +
      `ニックネーム: ${member.nickname}\n` +
      `年齢        : ${member.age}歳\n` +
      `居住地      : ${member.prefecture}\n` +
      `職業        : ${member.occupation}\n` +
      (aiCompatibilityComment
        ? `\n--- AI相性コメント ---\n${aiCompatibilityComment}\n`
        : '') +
      '========================================\n'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin notify error:', error);
    return NextResponse.json(
      { error: '管理者通知に失敗しました' },
      { status: 500 }
    );
  }
}
