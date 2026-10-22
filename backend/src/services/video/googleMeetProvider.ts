import { IVideoMeetingProvider, MeetingDetails, MeetingRequest } from './types';

/**
 * Adapter for Google Meet / Google Calendar API integration.
 * Requires GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN.
 * Without active live API execution, strictly sets isAutomated: false and relies on verified manual links.
 * Never invents simulated meeting links or claims automated success when uncalled.
 */
export class GoogleMeetProvider implements IVideoMeetingProvider {
  readonly providerType = 'google_meet' as const;

  isConfigured(): boolean {
    return Boolean(
      process.env.GOOGLE_CALENDAR_CLIENT_ID &&
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET &&
      process.env.GOOGLE_CALENDAR_REFRESH_TOKEN
    );
  }

  async createMeeting(request: MeetingRequest): Promise<MeetingDetails> {
    const manualLink = request.locationOrLink?.trim();
    const hasValidUrl = manualLink ? /^https?:\/\//i.test(manualLink) : false;

    if (!this.isConfigured()) {
      return {
        providerType: 'google_meet',
        joinUrl: hasValidUrl ? manualLink : undefined,
        isAutomated: false,
        notes: hasValidUrl
          ? `Manual Google Meet link recorded: ${manualLink}`
          : 'Google Meet automated integration is not active (pending Google Workspace OAuth). A manual meeting link can be supplied.',
      };
    }

    return {
      providerType: 'google_meet',
      joinUrl: hasValidUrl ? manualLink : undefined,
      isAutomated: false,
      notes: hasValidUrl
        ? `Manual Google Meet link recorded: ${manualLink}`
        : 'Google Workspace credentials detected but live meeting creation requires calendar delegation. Using manual meeting arrangement.',
    };
  }
}
