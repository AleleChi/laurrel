import { IVideoMeetingProvider, MeetingDetails, MeetingRequest } from './types';

/**
 * Adapter for Zoom (Server-to-Server OAuth API).
 * Requires ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET.
 * Without active live API execution, strictly sets isAutomated: false and relies on verified manual links.
 * Never invents simulated meeting links or claims automated success when uncalled.
 */
export class ZoomProvider implements IVideoMeetingProvider {
  readonly providerType = 'zoom' as const;

  isConfigured(): boolean {
    return Boolean(
      process.env.ZOOM_ACCOUNT_ID &&
      process.env.ZOOM_CLIENT_ID &&
      process.env.ZOOM_CLIENT_SECRET
    );
  }

  async createMeeting(request: MeetingRequest): Promise<MeetingDetails> {
    const manualLink = request.locationOrLink?.trim();
    const hasValidUrl = manualLink ? /^https?:\/\//i.test(manualLink) : false;

    if (!this.isConfigured()) {
      return {
        providerType: 'zoom',
        joinUrl: hasValidUrl ? manualLink : undefined,
        isAutomated: false,
        notes: hasValidUrl
          ? `Manual Zoom link recorded: ${manualLink}`
          : 'Zoom automated integration is not active (pending Server-to-Server OAuth app). A manual meeting link can be supplied.',
      };
    }

    return {
      providerType: 'zoom',
      joinUrl: hasValidUrl ? manualLink : undefined,
      isAutomated: false,
      notes: hasValidUrl
        ? `Manual Zoom link recorded: ${manualLink}`
        : 'Zoom credentials detected but live meeting creation requires account delegation. Using manual meeting arrangement.',
    };
  }
}
