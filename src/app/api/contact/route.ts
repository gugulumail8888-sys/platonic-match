import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'amistasupport@gmail.com';

const baseStyle = `font-family: sans-serif; font-size: 14px; line-height: 1.8; max-width: 600px; margin: 0 auto; padding: 24px;`;
const footer = `<hr><p style="color: #888; font-size: 12px;">このメールはamistaシステムから自動送信されています。</p>`;

function wrap(content: string) {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"></head><body><div style="${baseStyle}">${content}${footer}</div></body></html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name?: string;
      email?: string;
      type?: string;
      subject?: string;
      body?: string;
    };

    const { name, email, type, subject, body: message } = body;
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!name?.trim() || !email?.trim() || !type?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'すべての項目を入力してください' }, { status: 400 });
    }

    // 管理者へ通知
    const { error: adminError } = await resend.emails.send({
      from: 'amista <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      subject: `【amista お問い合わせ】${subject}`,
      html: wrap(`
        <h2 style="color: #0d9488;">新しいお問い合わせが届きました</h2>
        <table style="width:100%; border-collapse:collapse; font-size:14px; margin-top:8px;">
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:8px 12px 8px 0; color:#6b7280; width:100px; vertical-align:top;">お名前</td><td style="padding:8px 0; color:#111827;">${name}</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:8px 12px 8px 0; color:#6b7280; vertical-align:top;">メール</td><td style="padding:8px 0; color:#111827;">${email}</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:8px 12px 8px 0; color:#6b7280; vertical-align:top;">種別</td><td style="padding:8px 0; color:#111827;">${type}</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:8px 12px 8px 0; color:#6b7280; vertical-align:top;">件名</td><td style="padding:8px 0; color:#111827;">${subject}</td></tr>
        </table>
        <h3 style="margin-top:16px; color:#111827;">お問い合わせ内容</h3>
        <div style="background:#f3f4f6; border-radius:8px; padding:16px; white-space:pre-wrap; color:#111827; border:1px solid #e5e7eb;">${message}</div>
      `),
      headers: { 'Content-Type': 'text/html; charset=UTF-8' },
    });

    if (adminError) {
      console.error('Contact admin mail error:', adminError);
      return NextResponse.json({ error: 'メールの送信に失敗しました' }, { status: 500 });
    }

    // 送信者へ受付確認
    const { error: userError } = await resend.emails.send({
      from: 'amista <onboarding@resend.dev>',
      to: email,
      subject: `【amista】お問い合わせを受け付けました`,
      html: wrap(`
        <h2 style="color: #0d9488;">お問い合わせを受け付けました</h2>
        <p>${name} 様、お問い合わせいただきありがとうございます。</p>
        <p>以下の内容で受け付けました。<strong>3営業日以内</strong>にご返信いたします。</p>
        <table style="width:100%; border-collapse:collapse; font-size:14px; margin-top:12px;">
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:8px 12px 8px 0; color:#6b7280; width:100px; vertical-align:top;">種別</td><td style="padding:8px 0; color:#111827;">${type}</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:8px 12px 8px 0; color:#6b7280; vertical-align:top;">件名</td><td style="padding:8px 0; color:#111827;">${subject}</td></tr>
        </table>
        <div style="background:#f3f4f6; border-radius:8px; padding:16px; margin-top:12px; white-space:pre-wrap; color:#111827; border:1px solid #e5e7eb;">${message}</div>
        <p style="margin-top:16px; color:#888; font-size:12px;">※ このメールに返信しないでください。お問い合わせは <a href="mailto:${ADMIN_EMAIL}" style="color:#0d9488;">${ADMIN_EMAIL}</a> までご連絡ください。</p>
      `),
      headers: { 'Content-Type': 'text/html; charset=UTF-8' },
    });

    if (userError) {
      console.error('Contact user mail error:', userError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Contact route error:', error);
    return NextResponse.json({ error: 'お問い合わせの送信に失敗しました' }, { status: 500 });
  }
}
