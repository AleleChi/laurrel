import { IVideoMeetingProvider, MeetingDetails, MeetingRequest } from './types';
import { getProviderIntegration } from '../../database/integrationRepo';
import { createGoogleMeetEvent } from './googleCalendarClient';

/**
 * Real Google Meet Provider supporting automated Google Calendar event creation
 * with conferenceDataVersion=1 when connected.
 */
export class GoogleMeetProvider implements IVideoMeetingProvider {
  readonly providerType = 'google_meet' as const;

  async isConnected(): Promise<boolean> {
    const integration = await getProviderIntegration('google_meet');
    return integration?.status === 'connected' && Boolean(integration.credentials?.refreshToken);
  }

  isConfigured(): boolean {
    return Boolean(
      (process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID) &&
      (process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET)
    );
  }

  async createMeeting(request: MeetingRequest): Promise<MeetingDetails> {
    const manualLink = request.locationOrLink?.trim();
    const hasValidUrl = manualLink ? /^https?:\/\//i.test(manualLink) : false;

    // 1. If a manual URL was explicitly supplied by an administrator, preserve it
    if (hasValidUrl) {
      return {
        providerType: 'google_meet',
        joinUrl: manualLink,
        isAutomated: false,
        notes: `Manual Google Meet link provided: ${manualLink}`,
      };
    }

    // 2. Check if Google Calendar integration is connected and authorized
    const isConnected = await this.isConnected();
    if (!isConnected) {
      return {
        providerType: 'google_meet',
        isAutomated: false,
        notes: 'Google Meet automated integration is currently disconnected in Admin Settings. Please connect Google Calendar or provide a manual link.',
      };
    }

    // 3. Automated creation with conferenceDataVersion=1
    try {
      const result = await createGoogleMeetEvent({
        title: request.title,
        description: request.purpose || 'Customer consultation with Laurrel Services',
        scheduledStartIso: request.startTime.toISOString(),
        scheduledEndIso: request.endTime.toISOString(),
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      });

      return {
        providerType: 'google_meet',
        meetingId: result.eventId,
        joinUrl: result.joinUrl,
        hostUrl: result.calendarLink,
        isAutomated: true,
        notes: `Google Meet meeting created: ${result.joinUrl}`,
      };
    } catch (err: any) {
      console.error('[Google Meet Provider] Automated meeting creation error:', err.message);
      return {
        providerType: 'google_meet',
        isAutomated: false,
        notes: `Automated creation failed: ${err.message}. Please coordinate by telephone or manual link.`,
      };
    }
  }
}
