import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';

type Person = {
  nickname: string;
  age: number;
  prefecture: string;
  occupation: string;
  email: string;
};

type NotifyBody = {
  type: 'new_application' | 'cancel_timeout' | 'cancel_unpaid' | 'cancel_request' | 'payment_reminder' | 'day_reminder' | 'survey_reminder' | 'matching_request' | 'matching_approved' | 'matching_rejected' | 'matching_expired' | 'schedule_proposed_request' | 'schedule_proposed' | 'schedule_confirmed' | 're_request_schedule' | 'schedule_postponed' | 'user_reported' | 'approval_document' | 'deficiency_document' | 'ai_option_renewal_reminder' | 'dormant_notice';
  applicationId: string;
  appliedAt: string;
  applicant: Person;
  member: Person;
  amount: number;
  aiCompatibilityComment?: string;
  // cancel_timeout用
  lateBy?: 'applicant' | 'member' | 'both';
  // payment_reminder / day_reminder用
  scheduledAt?: string;
  meetUrl?: string;
  // survey_reminder用
  surveyUrl?: string;
  // re_request_schedule用
  to?: string;
  applicantNickname?: string;
  partnerNickname?: string;
  re_request_message?: string;
  // schedule_postponed用
  requestedBy?: 'applicant' | 'member';
  // user_reported用
  reporterNickname?: string;
  reportedNickname?: string;
  reportCategory?: string;
  reportDetail?: string;
  // approval_document / deficiency_document用
  user?: { nickname: string; email: string };
  reason?: string;
  // ai_option_renewal_reminder用
  renewalDate?: string;
};

const FROM_EMAIL = 'amista <onboarding@resend.dev>';
const baseStyle = `font-family: sans-serif; font-size: 14px; line-height: 1.8; max-width: 600px; margin: 0 auto; padding: 24px;`;
const footer = `<hr><p style="color: #888; font-size: 12px;">このメールはamistaシステムから自動送信されています。</p>`;

function wrap(content: string) {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"></head><body><div style="${baseStyle}">${content}${footer}</div></body></html>`;
}

// 管理者通知の送信先メールアドレスを決定する。
// 優先順位: admin/settings画面の「連絡先メールアドレス」(settings.contact_email)
// > 環境変数ADMIN_EMAIL > 既定値
async function getAdminEmail(): Promise<string> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('settings')
      .select('value')
      .eq('key', 'contact_email')
      .maybeSingle();
    if (data?.value?.trim()) return data.value.trim();
  } catch (err) {
    console.error('getAdminEmail error:', err);
  }
  return process.env.ADMIN_EMAIL ?? 'admin@amista.jp';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as NotifyBody;

    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.INTERNAL_API_SECRET;
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: '未認証' }, { status: 401 });
    }

    const { type, applicationId, appliedAt, applicant, member, amount, aiCompatibilityComment, lateBy, scheduledAt, meetUrl, surveyUrl, requestedBy, reporterNickname, reportedNickname, reportCategory, reportDetail, renewalDate } = body;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const adminEmail = await getAdminEmail();

    const dateStr = appliedAt ? new Date(appliedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '';
    const amountStr = `¥${amount != null ? amount.toLocaleString() : ''}（税込）`;
    const scheduledDateStr = scheduledAt
      ? new Date(scheduledAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
      : null;

    const emails: { to: string; subject: string; html: string }[] = [];

    if (type === 'new_application') {
      // 管理者のみ
      emails.push({
        to: adminEmail,
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
        to: adminEmail,
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
        to: adminEmail,
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
        to: adminEmail,
        subject: `【amista】キャンセル依頼が届きました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #f59e0b;">キャンセル依頼が届きました</h2>
          <p>申請番号：${applicationId}<br>申請者：${applicant.nickname} さん</p>
          <p>キャンセル料（${amountStr}）の請求と、お相手（${member.nickname} さん）への返金処理について、管理者の許可のもと対応をお願いします。</p>
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

    } else if (type === 'payment_reminder') {
      // 支払いリマインド（お見合い3日前・未払い）
      const whenStr = scheduledDateStr ? `${scheduledDateStr}に` : '3日後に';

      // 管理者
      emails.push({
        to: adminEmail,
        subject: '【amista】お見合い料のお支払いのご案内',
        html: wrap(`
          <h2 style="color: #0d9488;">支払いリマインドを送信しました</h2>
          <p>申請番号：${applicationId}<br>お見合い予定：${whenStr}</p>
          <p>${applicant.nickname} さん・${member.nickname} さんへ、お見合い料（${amountStr}）のお支払いのご案内メールを送信しました。</p>
          <p>前日17時までにお支払いが確認できない場合は自動キャンセルとなります。</p>
        `),
      });

      // 申請者
      emails.push({
        to: applicant.email,
        subject: '【amista】お見合い料のお支払いのご案内',
        html: wrap(`
          <h2 style="color: #0d9488;">お見合い料のお支払いのご案内</h2>
          <p>${applicant.nickname} さん、${whenStr}お見合いが予定されています。</p>
          <p>お見合い料（${amountStr}）のお支払いを、<strong>お見合い前日の17時まで</strong>に完了してください。</p>
          <p>期日までにお支払いが確認できない場合、本お見合いは自動的にキャンセルとなりますのでご注意ください。</p>
        `),
      });

      // お相手
      emails.push({
        to: member.email,
        subject: '【amista】お見合い料のお支払いのご案内',
        html: wrap(`
          <h2 style="color: #0d9488;">お見合い料のお支払いのご案内</h2>
          <p>${member.nickname} さん、${whenStr}お見合いが予定されています。</p>
          <p>お見合い料（${amountStr}）のお支払いを、<strong>お見合い前日の17時まで</strong>に完了してください。</p>
          <p>期日までにお支払いが確認できない場合、本お見合いは自動的にキャンセルとなりますのでご注意ください。</p>
        `),
      });

    } else if (type === 'day_reminder') {
      // 当日リマインド（お見合い2時間前）
      const meetSection = meetUrl
        ? `<p>Google Meet URL：<a href="${meetUrl}">${meetUrl}</a></p>`
        : '';
      const whenStr = scheduledDateStr ? `本日${scheduledDateStr}` : '本日';

      // 申請者
      emails.push({
        to: applicant.email,
        subject: '【amista】本日のGoogle Meetお見合いのご案内',
        html: wrap(`
          <h2 style="color: #0d9488;">本日、お見合いが予定されています</h2>
          <p>${applicant.nickname} さん、${whenStr}よりGoogle Meetでのお見合いが予定されています。2時間後に開始予定です。</p>
          ${meetSection}
          <p>明るく静かな環境でのご参加をお願いいたします。</p>
          <p style="font-size:13px; color:#666;">
            連絡先の交換・個人情報の共有・画面の録画などはご遠慮いただいています。
            詳しい注意事項は<a href="${process.env.NEXT_PUBLIC_APP_URL}/zoom-check">お見合い中の注意事項</a>をご確認ください。
          </p>
        `),
      });

      // お相手
      emails.push({
        to: member.email,
        subject: '【amista】本日のGoogle Meetお見合いのご案内',
        html: wrap(`
          <h2 style="color: #0d9488;">本日、お見合いが予定されています</h2>
          <p>${member.nickname} さん、${whenStr}よりGoogle Meetでのお見合いが予定されています。2時間後に開始予定です。</p>
          ${meetSection}
          <p>明るく静かな環境でのご参加をお願いいたします。</p>
          <p style="font-size:13px; color:#666;">
            連絡先の交換・個人情報の共有・画面の録画などはご遠慮いただいています。
            詳しい注意事項は<a href="${process.env.NEXT_PUBLIC_APP_URL}/zoom-check">お見合い中の注意事項</a>をご確認ください。
          </p>
        `),
      });

    } else if (type === 'matching_request') {
      // お見合い申請通知（申請者・お相手へ）
      // 申請者
      emails.push({
        to: applicant.email,
        subject: `【amista】お見合い申請を送りました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #0d9488;">お見合い申請を送りました</h2>
          <p>${applicant.nickname} さん、${member.nickname} さんへのお見合い申請を受け付けました。</p>
          <p>お相手の返答をお待ちください。<strong>7日以内</strong>に返答がない場合は自動的に不成立となります。</p>
          <p style="color:#888; font-size:12px;">申請番号：${applicationId}</p>
        `),
      });

      // お相手
      emails.push({
        to: member.email,
        subject: `【amista】お見合い申請が届きました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #0d9488;">お見合い申請が届きました</h2>
          <p>${member.nickname} さん、${applicant.nickname} さんからお見合いの申請が届いています。</p>
          <table style="width:100%; border-collapse:collapse; font-size:14px; margin-top:8px;">
            <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:8px 12px 8px 0; color:#6b7280; width:100px;">申請者</td><td style="padding:8px 0; color:#111827;">${applicant.nickname}（${applicant.age}歳・${applicant.prefecture}）</td></tr>
            <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:8px 12px 8px 0; color:#6b7280;">職業</td><td style="padding:8px 0; color:#111827;">${applicant.occupation}</td></tr>
          </table>
          <p style="margin-top:12px;">マイページから<strong>承認または辞退</strong>をお選びください。<strong>7日以内</strong>にご返答がない場合は自動的に不成立となります。</p>
          <p style="color:#888; font-size:12px;">申請番号：${applicationId}</p>
        `),
      });

    } else if (type === 'matching_approved') {
      // お見合い成立通知（両者へ）
      // 申請者
      emails.push({
        to: applicant.email,
        subject: `【amista】お見合いが成立しました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #0d9488;">お見合いが成立しました！</h2>
          <p>${applicant.nickname} さん、${member.nickname} さんがお見合いを承認しました。</p>
          <p>マイページから日程調整にお進みください。Google Meetにてお見合いを行っていただきます。</p>
          <p style="color:#888; font-size:12px;">申請番号：${applicationId}</p>
        `),
      });

      // お相手
      emails.push({
        to: member.email,
        subject: `【amista】お見合いが成立しました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #0d9488;">お見合いが成立しました！</h2>
          <p>${member.nickname} さん、${applicant.nickname} さんとのお見合いが成立しました。</p>
          <p>マイページから日程調整にお進みください。Google Meetにてお見合いを行っていただきます。</p>
          <p style="color:#888; font-size:12px;">申請番号：${applicationId}</p>
        `),
      });

    } else if (type === 'matching_rejected') {
      // 申請辞退通知（申請者のみ）
      emails.push({
        to: applicant.email,
        subject: `【amista】お見合い申請についてのご連絡（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #f59e0b;">お見合い申請についてのご連絡</h2>
          <p>${applicant.nickname} さん、申請いただきありがとうございました。</p>
          <p>誠に恐れ入りますが、今回はご縁がなかったようです。</p>
          <p>引き続きamistaをご利用いただき、素敵な出会いを見つけてください。</p>
          <p style="color:#888; font-size:12px;">申請番号：${applicationId}</p>
        `),
      });

    } else if (type === 'matching_expired') {
      // 7日間未返答による自動不成立（申請者のみ）
      emails.push({
        to: applicant.email,
        subject: `【amista】お見合い申請が期限切れとなりました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #6b7280;">お見合い申請が期限切れとなりました</h2>
          <p>${applicant.nickname} さん、申請いただきありがとうございました。</p>
          <p>7日間お相手からの返答がなかったため、今回のお見合い申請は自動的に不成立となりました。</p>
          <p>引き続きamistaをご利用いただき、素敵な出会いを見つけてください。</p>
          <p style="color:#888; font-size:12px;">申請番号：${applicationId}</p>
        `),
      });

    } else if (type === 'schedule_proposed_request') {
      // 自動承認後、申請者に候補日提案を促すメール
      emails.push({
        to: applicant.email,
        subject: '【amista】お見合いが承認されました！候補日をご提案ください',
        html: wrap(`
          <p>${applicant.nickname}さん、こんにちは。</p>
          <p><strong>${member.nickname}さん</strong>がお見合い申請を承認されました！</p>
          <p>次のステップとして、お見合いの候補日時を3〜5件ご提案ください。</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/schedule/request?id=${applicationId}&name=${encodeURIComponent(member.nickname)}"
              style="display:inline-block;padding:12px 24px;background:#0d9488;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
              候補日を提案する
            </a>
          </p>
          <p style="color:#888;font-size:12px;">※このリンクはログイン後に有効です。</p>
        `),
      });

      // お相手にも承認済みの旨を通知
      emails.push({
        to: member.email,
        subject: '【amista】お見合い申請を承認しました',
        html: wrap(`
          <p>${member.nickname}さん、こんにちは。</p>
          <p><strong>${applicant.nickname}さん</strong>のお見合い申請を承認しました。</p>
          <p>相手の方が候補日を提案次第、日程選択のご案内をお送りします。</p>
          <p>もうしばらくお待ちください。</p>
        `),
      });

    } else if (type === 'schedule_proposed') {
      // 日程候補提案通知（お相手のみ）
      emails.push({
        to: member.email,
        subject: `【amista】お見合いの日程候補が届きました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #0d9488;">お見合いの日程候補が届きました</h2>
          <p>${member.nickname} さん、${applicant.nickname} さんからお見合いの日程候補が届きました。</p>
          <p>マイページから候補日時をご確認のうえ、ご都合の良い日程をお選びください。</p>
          <p style="color:#888; font-size:12px;">申請番号：${applicationId}</p>
        `),
      });

    } else if (type === 'schedule_confirmed') {
      // 日程確定通知（両者へ）
      const whenStr = scheduledDateStr ?? '';
      const meetSection = meetUrl
        ? `<p>お見合い開始時刻になりましたら、<a href="${process.env.NEXT_PUBLIC_APP_URL}/matching">マイページの「Meetに参加する」ボタン</a>からご参加ください。</p>`
        : '<p>Google Meetリンクは別途事務局よりお送りします。</p>';

      // 申請者
      emails.push({
        to: applicant.email,
        subject: `【amista】お見合いの日程が確定しました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #0d9488;">お見合いの日程が確定しました！</h2>
          <p>${applicant.nickname} さん、${member.nickname} さんとのお見合い日程が確定しました。</p>
          <p>日時：${whenStr}</p>
          ${meetSection}
          <p style="font-size:13px; color:#666;">
            連絡先の交換・個人情報の共有・画面の録画などはご遠慮いただいています。
            詳しい注意事項は<a href="${process.env.NEXT_PUBLIC_APP_URL}/zoom-check">お見合い中の注意事項</a>をご確認ください。
          </p>
          <p style="color:#888; font-size:12px;">申請番号：${applicationId}</p>
        `),
      });

      // お相手
      emails.push({
        to: member.email,
        subject: `【amista】お見合いの日程が確定しました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #0d9488;">お見合いの日程が確定しました！</h2>
          <p>${member.nickname} さん、${applicant.nickname} さんとのお見合い日程が確定しました。</p>
          <p>日時：${whenStr}</p>
          ${meetSection}
          <p style="font-size:13px; color:#666;">
            連絡先の交換・個人情報の共有・画面の録画などはご遠慮いただいています。
            詳しい注意事項は<a href="${process.env.NEXT_PUBLIC_APP_URL}/zoom-check">お見合い中の注意事項</a>をご確認ください。
          </p>
          <p style="color:#888; font-size:12px;">申請番号：${applicationId}</p>
        `),
      });

    } else if (type === 'schedule_postponed') {
      // 延期通知（両者へ）
      const requesterLabel = requestedBy === 'applicant' ? applicant.nickname : member.nickname;

      emails.push({
        to: applicant.email,
        subject: `【amista】お見合い日程が延期になりました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #0d9488;">お見合い日程が延期になりました</h2>
          <p>${applicant.nickname} さん、${requesterLabel}さんからの申し出により、確定していたお見合い日程が延期となりました。</p>
          <p>マイページから新しい候補日を再度ご提案ください。</p>
          <p style="color:#888; font-size:12px;">申請番号：${applicationId}</p>
        `),
      });

      emails.push({
        to: member.email,
        subject: `【amista】お見合い日程が延期になりました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #0d9488;">お見合い日程が延期になりました</h2>
          <p>${member.nickname} さん、${requesterLabel}さんからの申し出により、確定していたお見合い日程が延期となりました。</p>
          <p>お相手から新しい候補日が提案されましたら、あらためてマイページにてご確認ください。</p>
          <p style="color:#888; font-size:12px;">申請番号：${applicationId}</p>
        `),
      });

    } else if (type === 'user_reported') {
      // 通報通知（管理者のみ）
      emails.push({
        to: adminEmail,
        subject: `【amista】通報が届きました（${applicationId}）`,
        html: wrap(`
          <h2 style="color: #e11d48;">通報が届きました</h2>
          <p>申請番号：${applicationId}</p>
          <p>通報者：${reporterNickname ?? '不明'}</p>
          <p>対象：${reportedNickname ?? '不明'}</p>
          <p>種別：${reportCategory ?? '不明'}</p>
          <p>詳細：${reportDetail || '（詳細記入なし）'}</p>
          <p>管理画面の「通報一覧」から詳細をご確認ください。</p>
        `),
      });

    } else if (type === 'survey_reminder') {
      // アンケート依頼（お見合い終了1〜2時間後）
      const surveySection = surveyUrl
        ? `<p><a href="${surveyUrl}">${surveyUrl}</a></p>`
        : '';

      // 申請者
      emails.push({
        to: applicant.email,
        subject: '【amista】お見合いアンケートのご協力をお願いします',
        html: wrap(`
          <h2 style="color: #0d9488;">お見合いお疲れ様でした</h2>
          <p>${applicant.nickname} さん、本日のお見合いはいかがでしたでしょうか。</p>
          <p>今後のサービス向上のため、アンケートのご協力をお願いいたします。</p>
          ${surveySection}
        `),
      });

      // お相手
      emails.push({
        to: member.email,
        subject: '【amista】お見合いアンケートのご協力をお願いします',
        html: wrap(`
          <h2 style="color: #0d9488;">お見合いお疲れ様でした</h2>
          <p>${member.nickname} さん、本日のお見合いはいかがでしたでしょうか。</p>
          <p>今後のサービス向上のため、アンケートのご協力をお願いいたします。</p>
          ${surveySection}
        `),
      });
    } else if (type === 're_request_schedule') {
      const { to, applicantNickname, partnerNickname, re_request_message } = body;
      await resend.emails.send({
        from: FROM_EMAIL,
        to: to!,
        subject: `【amista】${partnerNickname}さんから日程の再提案依頼が届きました`,
        html: `
          <p>${applicantNickname} さん</p>
          <p>${partnerNickname}さんから、候補日の再提案をお願いしたいとのご連絡が届きました。</p>
          <br/>
          <p><strong>【希望の曜日・時間帯】</strong></p>
          <p style="background:#f5f5f5;padding:12px;border-radius:6px;">${re_request_message}</p>
          <br/>
          <p>マイページの「マッチング」から新しい候補日を提案してください。</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/matching" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#0d9488;color:white;border-radius:6px;text-decoration:none;">マイページへ</a>
          <br/><br/>
          <p style="color:#999;font-size:12px;">※ このメールはamistaから自動送信されています。</p>
        `,
      });
    }

    if (type === 'approval_document' && body.user) {
      emails.push({
        to: body.user.email,
        subject: '【amista】本人確認が完了しました',
        html: wrap(`
          <p>${body.user.nickname} さん</p>
          <p>本人確認書類の審査が完了し、承認されました。</p>
          <p>これですべての機能をご利用いただけます。</p>
          <p>ぜひマイページからプロフィールを確認し、活動を始めてください。</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/mypage"
              style="background:#0d9488;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">
              マイページへ
            </a>
          </div>
        `),
      });
    }

    if (type === 'deficiency_document' && body.user) {
      emails.push({
        to: body.user.email,
        subject: '【amista】本人確認書類に不備があります',
        html: wrap(`
          <p>${body.user.nickname} さん</p>
          <p>提出いただいた本人確認書類を確認いたしましたが、以下の理由により再提出をお願いいたします。</p>
          ${body.reason ? `<div style="background:#1e293b;padding:16px;border-radius:8px;margin:16px 0;">${body.reason}</div>` : ''}
          <p>マイページの設定タブから書類を再アップロードしてください。</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/mypage"
              style="background:#0d9488;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">
              マイページへ
            </a>
          </div>
        `),
      });
    }

    if (type === 'dormant_notice' && body.user) {
      emails.push({
        to: body.user.email,
        subject: '【amista】長期間ログインがないことについてのお知らせ',
        html: wrap(`
          <p>${body.user.nickname} さん</p>
          <p>長期間ログインが確認できておりません。</p>
          <p>今後もamistaのご利用を継続されない場合、会員資格が取り消される場合がございます。</p>
          <p>引き続きご利用の場合は、お手数ですが一度ログインいただきますようお願いいたします。</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
              style="background:#0d9488;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">
              ログインする
            </a>
          </div>
        `),
      });
    }

    if (type === 'ai_option_renewal_reminder' && body.user) {
      const renewalDateStr = renewalDate
        ? new Date(renewalDate).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })
        : '';
      emails.push({
        to: body.user.email,
        subject: '【amista】AIおすすめオプションの次回更新について',
        html: wrap(`
          <p>${body.user.nickname} さん</p>
          <p>AIおすすめオプションをご利用いただきありがとうございます。</p>
          <p>現在の請求期間は${renewalDateStr}に終了し、自動的に更新されます。</p>
          <p>解約をご希望の場合は、期間終了前にマイページからお手続きください。</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/mypage"
              style="background:#0d9488;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">
              マイページへ
            </a>
          </div>
        `),
      });
    }

    // 全メール送信
    for (const mail of emails) {
      const { error } = await resend.emails.send({
        from: 'amista <onboarding@resend.dev>',
        ...mail,
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
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
