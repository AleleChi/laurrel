import { AppointmentType, IVideoMeetingProvider, MeetingDetails, MeetingRequest } from './types';

/**
 * Handles telephone, in-person, on-site assessments and manual video link entries.
 * Never invents fake links or sends host credentials.
 */
export class ManualMeetingProvider implements IVideoMeetingProvider {
  readonly providerType: AppointmentType;

  constructor(type: AppointmentType = 'telephone') {
    this.providerType = type;
  }

  isConfigured(): boolean {
    return true;
  }

  async createMeeting(request: MeetingRequest): Promise<MeetingDetails> {
    const rawLink = request.locationOrLink?.trim() || '';

    switch (request.appointmentType) {
      case 'telephone': {
        const phone = request.customerPhone || 'Phone number to be confirmed';
        return {
          providerType: 'telephone',
          phoneDialIn: phone,
          location: `Telephone call to customer: ${phone}`,
          isAutomated: false,
          notes: 'Staff coordinator will initiate phone call at scheduled consultation time.',
        };
      }

      case 'in_person': {
        const address = rawLink || 'Laurrel Services Office (Ottawa, ON)';
        return {
          providerType: 'in_person',
          location: address,
          isAutomated: false,
          notes: `In-person meeting at: ${address}`,
        };
      }

      case 'on_site': {
        const propertyAddress = rawLink || 'Customer property location (Ottawa Area)';
        return {
          providerType: 'on_site',
          location: propertyAddress,
          isAutomated: false,
          notes: `On-site assessment at: ${propertyAddress}`,
        };
      }

      case 'google_meet':
      case 'ms_teams':
      case 'zoom': {
        // When automatic integration is not configured, validate and use manually supplied URL
        let validUrl: string | undefined;
        if (rawLink && /^https?:\/\//i.test(rawLink)) {
          validUrl = rawLink;
        }

        return {
          providerType: request.appointmentType,
          joinUrl: validUrl,
          isAutomated: false,
          notes: validUrl
            ? `Manual meeting link provided: ${validUrl}`
            : 'Meeting link not provided. Coordinator will supply before consultation.',
        };
      }

      default:
        return {
          providerType: 'telephone',
          isAutomated: false,
        };
    }
  }
}
