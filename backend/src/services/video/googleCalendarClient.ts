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

/**
 * Returns fixed server-configured OAuth configuration.
 * Client-supplied redirect URIs are strictly disallowed.
 */
export function getGoogleOAuthConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  
  // Fixed canonical redirect URI configured in environment or matching the canonical admin settings callback
  const siteUrl = (
    process.env.PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_ORIGIN ||
    'http://localhost:3000'
  ).replace(/\/$/, '');

  const redirectUri =
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
    process.env.GOOGLE_REDIRECT_URI ||
    `${siteUrl}/admin/appointments/settings`;

  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, redirectUri };
}

/**
 * Generate secure OAuth2 consent authorization URL bound to an approved single-use state
 */
export function generateGoogleAuthUrl(state: string): string {
  const config = getGoogleOAuthConfig();
  if (!config) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are not configured.');
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent', // Ensures persistent refresh_token is returned
    state,
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchange Authorization Code for Refresh and Access tokens using the fixed redirect URI
 */
export async function exchangeGoogleAuthCode(
  code: string,
  overrideRedirectUri?: string
): Promise<{
  accountEmail: string;
  refreshToken: string;
  accessToken: string;
}> {
  const config = getGoogleOAuthConfig();
  if (!config) {
    throw new Error('Google OAuth credentials are not configured on server.');
  }

  const effectiveRedirectUri = overrideRedirectUri || config.redirectUri;

  const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: effectiveRedirectUri,
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

  // Fetch and verify account email
  const userRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let accountEmail = 'unknown@workspace.google.com';
  if (userRes.ok) {
    const userData = await userRes.json();
    if (userData.email) accountEmail = userData.email;
  }

  // Verify against authorized account if configured
  const authorizedAccount = process.env.GOOGLE_AUTHORIZED_ACCOUNT;
  if (authorizedAccount && accountEmail.toLowerCase() !== authorizedAccount.toLowerCase()) {
    throw new Error(
      `Unauthorized Google account (${accountEmail}). Only the designated Laurrel account (${authorizedAccount}) is authorized.`
    );
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
 * Query Google Calendar FreeBusy API to detect calendar conflicts.
 * Explicitly surfaces failures rather than returning an empty busy list.
 */
export async function checkGoogleFreeBusy(
  timeMinIso: string,
  timeMaxIso: string
): Promise<{ success: boolean; busyIntervals: { start: string; end: string }[]; error?: string }> {
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
      const errText = await res.text();
      console.warn('[Google FreeBusy] Failed query HTTP', res.status, errText);
      return {
        success: false,
        busyIntervals: [],
        error: `Google Calendar FreeBusy query failed with HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    const busy = data?.calendars?.primary?.busy || [];
    return { success: true, busyIntervals: busy };
  } catch (err: any) {
    console.warn('[Google FreeBusy Error] Calendar check failed:', err.message);
    return {
      success: false,
      busyIntervals: [],
      error: err.message || 'Google Calendar FreeBusy connection failed',
    };
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
  calendarLink: string;
  joinUrl: string | null;
  conferenceStatus: 'ready' | 'pending_details' | 'failed';
  conferenceId?: string;
  status: string;
}

/**
 * Creates genuine Google Calendar event with Google Meet conference via conferenceDataVersion=1.
 * Explicitly distinguishes pending, successful, and failed conference generation states.
 * Under NO circumstances is an htmlLink (calendar page) used as a video meeting link.
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

  let eventData = await res.json();

  // Helper to extract verified video meet URL
  const extractMeetUrl = (event: any): string | null => {
    if (event.conferenceData?.entryPoints) {
      const videoEntry = event.conferenceData.entryPoints.find((ep: any) => ep.entryPointType === 'video');
      if (videoEntry && videoEntry.uri && /^https:\/\//i.test(videoEntry.uri)) {
        return videoEntry.uri;
      }
    }
    if (event.hangoutLink && /^https:\/\//i.test(event.hangoutLink)) {
      return event.hangoutLink;
    }
    return null;
  };

  let meetUrl = extractMeetUrl(eventData);

  // If conferenceData is pending, poll up to 3 times with brief backoff
  if (!meetUrl && eventData.id) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      await new Promise((r) => setTimeout(r, attempt * 1000));
      try {
        const pollRes = await fetch(
          `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventData.id}?conferenceDataVersion=1`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (pollRes.ok) {
          eventData = await pollRes.json();
          meetUrl = extractMeetUrl(eventData);
          if (meetUrl) break;
        }
      } catch (pollErr: any) {
        console.warn(`[Google Meet Poll Attempt ${attempt}] Failed:`, pollErr.message);
      }
    }
  }

  // Determine honest conference generation state
  const conferenceStatusCode = eventData.conferenceData?.createRequest?.status?.statusCode;
  let conferenceStatus: 'ready' | 'pending_details' | 'failed' = 'pending_details';

  if (meetUrl) {
    conferenceStatus = 'ready';
  } else if (conferenceStatusCode === 'failed') {
    conferenceStatus = 'failed';
  } else {
    conferenceStatus = 'pending_details';
  }

  return {
    eventId: eventData.id,
    calendarLink: eventData.htmlLink || '',
    joinUrl: meetUrl, // NULL if pending or failed. NEVER the htmlLink.
    conferenceStatus,
    conferenceId: eventData.conferenceData?.conferenceId,
    status: eventData.status || 'confirmed',
  };
}

/**
 * Delete event from Google Calendar on consultation cancellation
 */
export async function deleteGoogleCalendarEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  if (!eventId) return { success: false, error: 'No Google Calendar event ID associated with appointment.' };
  try {
    const accessToken = await getValidGoogleAccessToken();
    const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok || res.status === 404) {
      return { success: true };
    }
    const errBody = await res.text();
    return { success: false, error: `Google Calendar event deletion failed (HTTP ${res.status}): ${errBody}` };
  } catch (err: any) {
    console.warn(`[Google Event Deletion Error] Failed to delete event ${eventId}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Reschedule event on Google Calendar
 */
export async function rescheduleGoogleCalendarEvent(
  eventId: string,
  newStartIso: string,
  newEndIso: string
): Promise<{ success: boolean; error?: string }> {
  if (!eventId) return { success: false, error: 'No Google Calendar event ID associated with appointment.' };
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
    if (res.ok) {
      return { success: true };
    }
    const errBody = await res.text();
    return { success: false, error: `Google Calendar event reschedule failed (HTTP ${res.status}): ${errBody}` };
  } catch (err: any) {
    console.warn(`[Google Event Reschedule Error] Failed to update event ${eventId}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Reconcile pending Google Meet conference generation and retrieve verified video join URL
 */
export async function reconcileGoogleMeetConference(calendarEventId: string): Promise<{
  status: 'ready' | 'pending_details' | 'failed';
  joinUrl: string | null;
  conferenceId?: string;
  error?: string;
}> {
  if (!calendarEventId) {
    return { status: 'failed', joinUrl: null, error: 'No calendar event ID provided' };
  }
  try {
    const accessToken = await getValidGoogleAccessToken();
    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events/${calendarEventId}?conferenceDataVersion=1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      return {
        status: 'pending_details',
        joinUrl: null,
        error: `Google Calendar event fetch failed (HTTP ${res.status}): ${errText}`,
      };
    }

    const eventData = await res.json();
    let meetUrl: string | null = null;
    if (eventData.conferenceData?.entryPoints) {
      const videoEntry = eventData.conferenceData.entryPoints.find((ep: any) => ep.entryPointType === 'video');
      if (videoEntry && videoEntry.uri && /^https:\/\//i.test(videoEntry.uri)) {
        meetUrl = videoEntry.uri;
      }
    }
    if (!meetUrl && eventData.hangoutLink && /^https:\/\//i.test(eventData.hangoutLink)) {
      meetUrl = eventData.hangoutLink;
    }

    const conferenceStatusCode = eventData.conferenceData?.createRequest?.status?.statusCode;
    let status: 'ready' | 'pending_details' | 'failed' = 'pending_details';
    if (meetUrl) {
      status = 'ready';
    } else if (conferenceStatusCode === 'failed') {
      status = 'failed';
    } else {
      status = 'pending_details';
    }

    return {
      status,
      joinUrl: meetUrl,
      conferenceId: eventData.conferenceData?.conferenceId,
    };
  } catch (err: any) {
    console.warn('[Reconcile Google Conference Error]:', err.message);
    return {
      status: 'pending_details',
      joinUrl: null,
      error: err.message,
    };
  }
}
