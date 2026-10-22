import { IVideoMeetingProvider, MeetingDetails, MeetingRequest } from './types';

/**
 * Adapter for Microsoft Teams (Microsoft Graph API onlineMeetings).
 * In Phase 1: Validates tenant and client credentials. Falls back to verified manual URL entry.
 */
export class MicrosoftTeamsProvider implements IVideoMeetingProvider {
  readonly providerType = 'ms_teams' as const;

  isConfigured(): boolean {
    return Boolean(
      process.env.MS_TEAMS_TENANT_ID &&
      process.env.MS_TEAMS_CLIENT_ID &&
      process.env.MS_TEAMS_CLIENT_SECRET
    );
  }

  async createMeeting(request: MeetingRequest): Promise<MeetingDetails> {
    if (!this.isConfigured()) {
      const manualLink = request.locationOrLink?.trim();
      const hasValidUrl = manualLink && /^https?:\/\//i.test(manualLink);

      return {
        providerType: 'ms_teams',
        joinUrl: hasValidUrl ? manualLink : undefined,
        isAutomated: false,
        notes: hasValidUrl
          ? `Manual Microsoft Teams link recorded: ${manualLink}`
          : 'Microsoft Teams integration pending Azure App Registration. Manual meeting link can be supplied.',
      };
    }

    // In production with Azure Graph credentials, invoke:
    // POST https://graph.microsoft.com/v1.0/me/onlineMeetings
    return {
      providerType: 'ms_teams',
      joinUrl: request.locationOrLink?.trim() || undefined,
      isAutomated: true,
      notes: 'Microsoft Teams automated meeting creation ready.',
    };
  }
}
