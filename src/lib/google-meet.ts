import { createSign, randomUUID } from 'crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';
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
    scope: CALENDAR_SCOPE,
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

  if (!email || !privateKey || !calendarId) {
    return null;
  }

  try {
    const accessToken = await getAccessToken(email, privateKey);
    if (!accessToken) return null;

    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + MEETING_DURATION_MS);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
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
        }),
      }
    );

    if (!res.ok) {
      console.error('Google Calendar API error:', await res.text());
      return null;
    }

    const data = await res.json() as {
      conferenceData?: { entryPoints?: { uri?: string }[] };
    };

    return data.conferenceData?.entryPoints?.[0]?.uri ?? null;
  } catch (error) {
    console.error('createGoogleMeetUrl error:', error);
    return null;
  }
}
