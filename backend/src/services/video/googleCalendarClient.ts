import { getProviderIntegration, saveProviderCredentials, updateProviderStatus } from '../../database/integrationRepo';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function getGoogleOAuthConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
    process.env.GOOGLE_REDIRECT_URI ||
    'http://localhost:3000/api/admin/integrations/google/callback';

  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, redirectUri };
}

/**
 * Generate secure OAuth2 consent authorization URL
 */
export function generateGoogleAuthUrl(state: string, overrideRedirectUri?: string): string {
  const config = getGoogleOAuthConfig();
  if (!config) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are not configured.');
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: overrideRedirectUri || config.redirectUri,
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent', // Ensures persistent refresh_token is returned
    state,
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchange Authorization Code for Refresh and Access tokens
 */
export async function exchangeGoogleAuthCode(code: string, overrideRedirectUri?: string): Promise<{
  accountEmail: string;
  refreshToken: string;
  accessToken: string;
}> {
  const config = getGoogleOAuthConfig();
  if (!config) {
    throw new Error('Google OAuth credentials are not configured on server.');
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: overrideRedirectUri || config.redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('[Google OAuth Error] Token exchange failed:', errText);
    throw new Error(`Google token exchange failed: HTTP ${tokenRes.status}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;

  if (!refreshToken) {
    console.warn('[Google OAuth Warning] No refresh token returned. User may have already authorized without prompt=consent.');
  }

  // Fetch account email
  const userRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let accountEmail = 'unknown@workspace.google.com';
  if (userRes.ok) {
    const userData = await userRes.json();
    if (userData.email) accountEmail = userData.email;
  }

  // Persist encrypted in DB
  await saveProviderCredentials('google_meet', accountEmail, {
    refreshToken: refreshToken || '',
    accessToken,
    tokenExpiry: Date.now() + (tokenData.expires_in || 3600) * 1000,
    scope: tokenData.scope,
    tokenType: tokenData.token_type,
  });

  return { accountEmail, refreshToken, accessToken };
}

/**
 * Obtain a valid, active access token (refreshing automatically if expired)
 */
export async function getValidGoogleAccessToken(): Promise<string> {
  const config = getGoogleOAuthConfig();
  const integration = await getProviderIntegration('google_meet');

  if (!integration || integration.status !== 'connected' || !integration.credentials?.refreshToken) {
    throw new Error('Google Workspace integration is disconnected or missing refresh token.');
  }

  const creds = integration.credentials;
  const now = Date.now();

  // Return existing token if valid for at least 5 more minutes
  if (creds.accessToken && creds.tokenExpiry && creds.tokenExpiry > now + 5 * 60 * 1000) {
    return creds.accessToken;
  }

  if (!config) {
    throw new Error('Google OAuth credentials not configured on server.');
  }

  // Refresh token
  const refreshRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: creds.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!refreshRes.ok) {
    const errText = await refreshRes.text();
    console.error('[Google OAuth Refresh Error]:', errText);
    await updateProviderStatus('google_meet', 'error', 'Refresh token expired or revoked. Reconnection required.');
    throw new Error('Google authentication token expired. Please reconnect Google Calendar in Admin Settings.');
  }

  const refreshData = await refreshRes.json();
  const newAccessToken = refreshData.access_token;
  const newExpiry = Date.now() + (refreshData.expires_in || 3600) * 1000;

  // Update credentials in DB
  await saveProviderCredentials('google_meet', integration.accountEmail || 'primary', {
    ...creds,
    accessToken: newAccessToken,
    tokenExpiry: newExpiry,
  });

  return newAccessToken;
}

/**
 * Query Google Calendar FreeBusy API to detect calendar conflicts
 */
export async function checkGoogleFreeBusy(
  timeMinIso: string,
  timeMaxIso: string
): Promise<{ busyIntervals: { start: string; end: string }[] }> {
  try {
    const accessToken = await getValidGoogleAccessToken();
    const res = await fetch(`${GOOGLE_CALENDAR_API}/freeBusy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: timeMinIso,
        timeMax: timeMaxIso,
        timeZone: 'America/Toronto',
        items: [{ id: 'primary' }],
      }),
    });

    if (!res.ok) {
      console.warn('[Google FreeBusy] Failed query:', res.status);
      return { busyIntervals: [] };
    }

    const data = await res.json();
    const busy = data?.calendars?.primary?.busy || [];
    return { busyIntervals: busy };
  } catch (err: any) {
    console.warn('[Google FreeBusy Error] Skipping calendar busy check:', err.message);
    return { busyIntervals: [] };
  }
}

export interface CreateGoogleMeetEventParams {
  title: string;
  description: string;
  scheduledStartIso: string;
  scheduledEndIso: string;
  customerName: string;
  customerEmail: string;
  requestId: string;
}

export interface GoogleMeetEventResult {
  eventId: string;
  joinUrl: string;
  calendarLink: string;
  conferenceId?: string;
  status: string;
}

/**
 * Creates genuine Google Calendar event with Google Meet conference via conferenceDataVersion=1
 */
export async function createGoogleMeetEvent(
  params: CreateGoogleMeetEventParams
): Promise<GoogleMeetEventResult> {
  const accessToken = await getValidGoogleAccessToken();

  const eventPayload = {
    summary: params.title,
    description: `${params.description}\n\nClient: ${params.customerName} (${params.customerEmail})\nService: Laurrel Services Consultation`,
    start: {
      dateTime: params.scheduledStartIso,
      timeZone: 'America/Toronto',
    },
    end: {
      dateTime: params.scheduledEndIso,
      timeZone: 'America/Toronto',
    },
    attendees: [
      {
        email: params.customerEmail,
        displayName: params.customerName,
      },
    ],
    conferenceData: {
      createRequest: {
        requestId: params.requestId,
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  };

  const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events?conferenceDataVersion=1`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('[Google Calendar API Error] Event creation failed:', errBody);
    throw new Error(`Google Calendar API event creation failed (HTTP ${res.status}).`);
  }

  const created = await res.json();

  // Extract real Google Meet URL
  let meetUrl = '';
  if (created.conferenceData?.entryPoints) {
    const videoEntry = created.conferenceData.entryPoints.find((ep: any) => ep.entryPointType === 'video');
    if (videoEntry && videoEntry.uri) {
      meetUrl = videoEntry.uri;
    }
  }

  if (!meetUrl && created.hangoutLink) {
    meetUrl = created.hangoutLink;
  }

  if (!meetUrl) {
    console.warn('[Google Meet Warning] Event created but conferenceData uri is pending Google provisioning.');
    meetUrl = created.htmlLink || '';
  }

  return {
    eventId: created.id,
    joinUrl: meetUrl,
    calendarLink: created.htmlLink || '',
    conferenceId: created.conferenceData?.conferenceId,
    status: created.status || 'confirmed',
  };
}

/**
 * Delete event from Google Calendar on consultation cancellation
 */
export async function deleteGoogleCalendarEvent(eventId: string): Promise<boolean> {
  if (!eventId) return false;
  try {
    const accessToken = await getValidGoogleAccessToken();
    const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok || res.status === 404; // 404 already deleted is success
  } catch (err: any) {
    console.warn(`[Google Event Deletion Error] Failed to delete event ${eventId}:`, err.message);
    return false;
  }
}

/**
 * Reschedule event on Google Calendar
 */
export async function rescheduleGoogleCalendarEvent(
  eventId: string,
  newStartIso: string,
  newEndIso: string
): Promise<boolean> {
  if (!eventId) return false;
  try {
    const accessToken = await getValidGoogleAccessToken();
    const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start: { dateTime: newStartIso, timeZone: 'America/Toronto' },
        end: { dateTime: newEndIso, timeZone: 'America/Toronto' },
      }),
    });
    return res.ok;
  } catch (err: any) {
    console.warn(`[Google Event Reschedule Error] Failed to update event ${eventId}:`, err.message);
    return false;
  }
}
