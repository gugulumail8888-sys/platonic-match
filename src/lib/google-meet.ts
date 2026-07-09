import { createSign, randomUUID } from 'crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/meetings.space.readonly https://www.googleapis.com/auth/meetings.space.settings';
const MEETING_DURATION_MS = 40 * 60 * 1000;

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function getAccessToken(email: string, privateKey: string): Promise<string | null> {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({
    iss: email,
    sub: process.env.GOOGLE_WORKSPACE_USER ?? email,
    scope: SCOPES,
    aud: TOKEN_URL,
    iat: nowSec,
    exp: nowSec + 3600,
  }));

  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claim}`);
  signer.end();
  const signature = base64url(signer.sign(privateKey.replace(/\\n/g, '\n')));
  const jwt = `${header}.${claim}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    console.error('Google OAuth token error:', await res.text());
    return null;
  }

  const data = await res.json() as { access_token?: string };
  return data.access_token ?? null;
}

export async function createGoogleMeetUrl(scheduledAt: string, title: string): Promise<string | null> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  console.log('Google Meet 環境変数チェック:', {
    hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    hasKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    hasCalendarId: !!process.env.GOOGLE_CALENDAR_ID,
    keyLength: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.length,
  });

  if (!email || !privateKey || !calendarId) {
    return null;
  }

  try {
    const accessToken = await getAccessToken(email, privateKey);
    if (!accessToken) return null;

    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + MEETING_DURATION_MS);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=none`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: title,
          start: { dateTime: start.toISOString(), timeZone: 'Asia/Tokyo' },
          end: { dateTime: end.toISOString(), timeZone: 'Asia/Tokyo' },
          conferenceData: {
            createRequest: {
              requestId: randomUUID(),
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
          guestsCanModify: false,
        }),
      }
    );

    const responseText = await res.text();
    console.log('Google Calendar API response status:', res.status);
    console.log('Google Calendar API response body:', responseText);

    if (!res.ok) {
      console.error('Google Calendar API error:', responseText);
      return null;
    }

    const data = JSON.parse(responseText) as {
      conferenceData?: { entryPoints?: { uri?: string }[] };
      hangoutLink?: string;
    };

    const meetUrl = data.conferenceData?.entryPoints?.[0]?.uri
      ?? data.hangoutLink
      ?? null;
    console.log('conferenceData:', JSON.stringify(data.conferenceData));
    console.log('hangoutLink:', data.hangoutLink);

    return meetUrl;
  } catch (error) {
    console.error('createGoogleMeetUrl error:', error);
    return null;
  }
}

// ============================================================
// Meet REST API による実入室確認
// ============================================================

export function extractMeetingCode(zoomUrl: string): string | null {
  const match = zoomUrl.match(/meet\.google\.com\/([a-z0-9-]+)/i);
  return match ? match[1] : null;
}

export async function setSpaceAccessOpen(meetingCode: string): Promise<boolean> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !privateKey) return false;

  try {
    const accessToken = await getAccessToken(email, privateKey);
    if (!accessToken) return false;

    const res = await fetch(
      `https://meet.googleapis.com/v2/spaces/${encodeURIComponent(meetingCode)}?updateMask=config.accessType`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: { accessType: 'OPEN' } }),
      }
    );

    if (!res.ok) {
      console.error('setSpaceAccessOpen APIエラー:', await res.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('setSpaceAccessOpen error:', error);
    return false;
  }
}

export async function checkRealMeetingAttendance(
  zoomUrl: string,
  scheduledAt: string
): Promise<{
  participantCount: number;
  participants: { earliestStartTime: string | null; latestEndTime: string | null }[];
} | null> {
  const meetingCode = extractMeetingCode(zoomUrl);
  if (!meetingCode) return null;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !privateKey) return null;

  try {
    const accessToken = await getAccessToken(email, privateKey);
    if (!accessToken) return null;

    const filter = encodeURIComponent(`space.meeting_code="${meetingCode}"`);
    const listRes = await fetch(
      `https://meet.googleapis.com/v2/conferenceRecords?filter=${filter}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      console.error('Meet conferenceRecords取得エラー:', await listRes.text());
      return null;
    }

    const listData = await listRes.json() as {
      conferenceRecords?: { name: string; startTime?: string }[];
    };
    const records = listData.conferenceRecords ?? [];
    if (records.length === 0) return null;

    // startTimeがscheduledAt以降で最も近いものを選ぶ（startTimeが無ければ先頭＝最新を使う）
    let target = records[0];
    const withStartTime = records.filter((r) => r.startTime);
    if (withStartTime.length > 0) {
      const scheduledMs = new Date(scheduledAt).getTime();
      const onOrAfterScheduled = withStartTime.filter(
        (r) => new Date(r.startTime!).getTime() >= scheduledMs
      );
      const pool = onOrAfterScheduled.length > 0 ? onOrAfterScheduled : withStartTime;
      target = pool.reduce((closest, r) =>
        Math.abs(new Date(r.startTime!).getTime() - scheduledMs)
          < Math.abs(new Date(closest.startTime!).getTime() - scheduledMs)
          ? r
          : closest
      );
    }

    const participantsRes = await fetch(
      `https://meet.googleapis.com/v2/${target.name}/participants`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!participantsRes.ok) {
      console.error('Meet participants取得エラー:', await participantsRes.text());
      return null;
    }

    const participantsData = await participantsRes.json() as {
      participants?: { earliestStartTime?: string; latestEndTime?: string }[];
    };
    const participants = participantsData.participants ?? [];

    return {
      participantCount: participants.length,
      participants: participants.map((p) => ({
        earliestStartTime: p.earliestStartTime ?? null,
        latestEndTime: p.latestEndTime ?? null,
      })),
    };
  } catch (error) {
    console.error('checkRealMeetingAttendance error:', error);
    return null;
  }
}
