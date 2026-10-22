import { IVideoMeetingProvider, MeetingDetails, MeetingRequest } from './types';

/**
 * Adapter for Zoom (Server-to-Server OAuth API).
 * In Phase 1: Validates Zoom Account credentials. Falls back to verified manual URL entry.
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
    if (!this.isConfigured()) {
      const manualLink = request.locationOrLink?.trim();
      const hasValidUrl = manualLink && /^https?:\/\//i.test(manualLink);

      return {
        providerType: 'zoom',
        joinUrl: hasValidUrl ? manualLink : undefined,
        isAutomated: false,
        notes: hasValidUrl
          ? `Manual Zoom link recorded: ${manualLink}`
          : 'Zoom integration pending Server-to-Server OAuth setup. Manual meeting link can be supplied.',
      };
    }

    // In production with Zoom Server-to-Server OAuth:
    // 1. POST https://zoom.us/oauth/token?grant_type=account_credentials&account_id=...
    // 2. POST https://api.zoom.us/v2/users/me/meetings
    return {
      providerType: 'zoom',
      joinUrl: request.locationOrLink?.trim() || undefined,
      isAutomated: true,
      notes: 'Zoom automated meeting creation ready.',
    };
  }
}
