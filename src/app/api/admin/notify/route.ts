import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type Person = {
  nickname: string;
  age: number;
  prefecture: string;
  occupation: string;
  email: string;
};

type NotifyBody = {
  type: 'new_application' | 'cancel_timeout' | 'cancel_unpaid' | 'cancel_request';
  applicationId: string;
  appliedAt: string;
  applicant: Person;
  member: Person;
  amount: number;
  aiCompatibilityComment?: string;
  // cancel_timeout用
  lateBy?: 'applicant' | 'member' | 'both';
};

const baseStyle = `font-family: sans-serif; font-size: 14px; line-height: 1.8; max-width: 600px; margin: 0 auto; padding: 24px;`;
const footer = `<hr><p style="color: #888; font-size: 12px;">このメールはamistaシステムから自動送信されています。</p>`;

function wrap(content: string) {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"></head><body><div style="${baseStyle}">${content}${footer}</div></body></html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as NotifyBody;
    const { type, applicationId, appliedAt, applicant, member, amount, aiCompatibilityComment, lateBy } = body;

    const dateStr = new Date(appliedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const amountStr = `¥${amount.toLocaleString()}（税込）`;

    const emails: { to: string; subject: string; html: string }[] = [];

    if (type === 'new_application') {
      // 管理者のみ
      emails.push({
        to: process.env.ADMIN_EMAIL ?? 'admin@amista.jp',
        subject: `【amista】新しいお見合い申請が届きました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #0d9488;">新しいお見合い申請が届きました</h2>
          <h3>申請詳細</h3>
          <p>申請番号：${applicationId}<br>申請日時：${dateStr}<br>料金：${amountStr}</p>
          <h3>申請者情報</h3>
          <p>ニックネーム：${applicant.nickname}<br>年齢：${applicant.age}歳<br>居住地：${applicant.prefecture}<br>職業：${applicant.occupation}</p>
          <h3>お相手情報</h3>
          <p>ニックネーム：${member.nickname}<br>年齢：${member.age}歳<br>居住地：${member.prefecture}<br>職業：${member.occupation}</p>
          ${aiCompatibilityComment ? `<h3>AI相性コメント</h3><p>${aiCompatibilityComment}</p>` : ''}
        `),
      });

    } else if (type === 'cancel_timeout') {
      // 15分超過強制キャンセル
      const applicantLate = lateBy === 'applicant' || lateBy === 'both';
      const memberLate = lateBy === 'member' || lateBy === 'both';

      // 管理者
      emails.push({
        to: process.env.ADMIN_EMAIL ?? 'admin@amista.jp',
        subject: `【amista】お見合い強制キャンセル（15分超過）（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #dc2626;">お見合いが強制キャンセルされました（15分超過）</h2>
          <p>申請番号：${applicationId}<br>日時：${dateStr}</p>
          <p>遅刻：${lateBy === 'both' ? '両者' : lateBy === 'applicant' ? applicant.nickname : member.nickname}</p>
          ${applicantLate ? `<p>・${applicant.nickname} さんへキャンセル料（${amountStr}）を請求してください。</p>` : `<p>・${applicant.nickname} さんへ返金してください。</p>`}
          ${memberLate ? `<p>・${member.nickname} さんへキャンセル料（${amountStr}）を請求してください。</p>` : `<p>・${member.nickname} さんへ返金してください。</p>`}
        `),
      });

      // 申請者
      emails.push({
        to: applicant.email,
        subject: `【amista】お見合いが強制キャンセルされました（${applicationId}）`,
        html: wrap(applicantLate ? `
          <h2 style="color: #dc2626;">お見合いが強制キャンセルされました</h2>
          <p>${applicant.nickname} さん、お見合い開始から15分が経過したためキャンセルとなりました。</p>
          <p>キャンセル料として${amountStr}をご請求いたします。詳細は事務局よりご連絡します。</p>
        ` : `
          <h2 style="color: #0d9488;">お見合いがキャンセルされました</h2>
          <p>${applicant.nickname} さん、相手の方が15分を超えて来られなかったためキャンセルとなりました。</p>
          <p>お支払いいただいた${amountStr}を返金いたします。詳細は事務局よりご連絡します。</p>
        `),
      });

      // お相手
      emails.push({
        to: member.email,
        subject: `【amista】お見合いが強制キャンセルされました（${applicationId}）`,
        html: wrap(memberLate ? `
          <h2 style="color: #dc2626;">お見合いが強制キャンセルされました</h2>
          <p>${member.nickname} さん、お見合い開始から15分が経過したためキャンセルとなりました。</p>
          <p>キャンセル料として${amountStr}をご請求いたします。詳細は事務局よりご連絡します。</p>
        ` : `
          <h2 style="color: #0d9488;">お見合いがキャンセルされました</h2>
          <p>${member.nickname} さん、相手の方が15分を超えて来られなかったためキャンセルとなりました。</p>
          <p>お支払いいただいた${amountStr}を返金いたします。詳細は事務局よりご連絡します。</p>
        `),
      });

    } else if (type === 'cancel_unpaid') {
      // 支払い未完了キャンセル
      // 管理者
      emails.push({
        to: process.env.ADMIN_EMAIL ?? 'admin@amista.jp',
        subject: `【amista】支払い未完了によるキャンセル（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #dc2626;">支払い未完了によりキャンセルされました</h2>
          <p>申請番号：${applicationId}<br>日時：${dateStr}</p>
          <p>申請者：${applicant.nickname} さんが期日までに支払いを完了しませんでした。</p>
          <p>お相手（${member.nickname} さん）へ返金処理を行ってください。</p>
        `),
      });

      // 申請者
      emails.push({
        to: applicant.email,
        subject: `【amista】お見合い申請がキャンセルされました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #dc2626;">お見合い申請がキャンセルされました</h2>
          <p>${applicant.nickname} さん、お支払いが期日までに確認できなかったため、お見合い申請（${applicationId}）はキャンセルとなりました。</p>
          <p>再度お見合いをご希望の場合は、改めて申請をお願いいたします。</p>
        `),
      });

      // お相手
      emails.push({
        to: member.email,
        subject: `【amista】お見合いがキャンセルされました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #0d9488;">お見合いがキャンセルされました</h2>
          <p>${member.nickname} さん、申請者の支払いが確認できなかったため、お見合い（${applicationId}）はキャンセルとなりました。</p>
          <p>お支払いいただいた${amountStr}を返金いたします。詳細は事務局よりご連絡します。</p>
        `),
      });

    } else if (type === 'cancel_request') {
      // 申請者からの手動キャンセル
      // 管理者
      emails.push({
        to: process.env.ADMIN_EMAIL ?? 'admin@amista.jp',
        subject: `【amista】キャンセル依頼が届きました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #f59e0b;">キャンセル依頼が届きました</h2>
          <p>申請番号：${applicationId}<br>申請者：${applicant.nickname} さん</p>
          <p>キャンセル料（${amountStr}）の請求と、お相手（${member.nickname} さん）への返金処理を行ってください。</p>
        `),
      });

      // 申請者
      emails.push({
        to: applicant.email,
        subject: `【amista】キャンセルを受け付けました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #f59e0b;">キャンセルを受け付けました</h2>
          <p>${applicant.nickname} さん、キャンセルのご依頼を受け付けました。</p>
          <p>なお、当サービスのお見合い申請は原則キャンセル不可となっております。キャンセル料として<strong>${amountStr}</strong>が別途発生いたします。</p>
          <p>詳細は事務局よりご連絡いたします。</p>
        `),
      });

      // お相手
      emails.push({
        to: member.email,
        subject: `【amista】お見合いがキャンセルされました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #0d9488;">お見合いがキャンセルされました</h2>
          <p>${member.nickname} さん、申請者よりキャンセルのご依頼があり、お見合い（${applicationId}）はキャンセルとなりました。</p>
          <p>お支払いいただいた${amountStr}を返金いたします。詳細は事務局よりご連絡します。</p>
        `),
      });
    }

    // 全メール送信
    for (const mail of emails) {
      const { error } = await resend.emails.send({
        from: 'amista <onboarding@resend.dev>',
        ...mail,
      });
      if (error) {
        console.error('Mail send error:', error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Admin notify error:', error);
    return NextResponse.json({ error: '通知メールの送信に失敗しました' }, { status: 500 });
  }
}
