import { IVideoMeetingProvider, MeetingDetails, MeetingRequest } from './types';

/**
 * Adapter for Microsoft Teams (Microsoft Graph API onlineMeetings).
 * Requires MS_TEAMS_TENANT_ID, MS_TEAMS_CLIENT_ID, MS_TEAMS_CLIENT_SECRET.
 * Without active live API execution, strictly sets isAutomated: false and relies on verified manual links.
 * Never invents simulated meeting links or claims automated success when uncalled.
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
    const manualLink = request.locationOrLink?.trim();
    const hasValidUrl = manualLink ? /^https?:\/\//i.test(manualLink) : false;

    if (!this.isConfigured()) {
      return {
        providerType: 'ms_teams',
        joinUrl: hasValidUrl ? manualLink : undefined,
        isAutomated: false,
        notes: hasValidUrl
          ? `Manual Microsoft Teams link recorded: ${manualLink}`
          : 'Microsoft Teams automated integration is not active (pending Azure App Registration). A manual meeting link can be supplied.',
      };
    }

    return {
      providerType: 'ms_teams',
      joinUrl: hasValidUrl ? manualLink : undefined,
      isAutomated: false,
      notes: hasValidUrl
        ? `Manual Microsoft Teams link recorded: ${manualLink}`
        : 'Azure App credentials detected but live meeting creation requires Graph delegation. Using manual meeting arrangement.',
    };
  }
}
