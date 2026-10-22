import { AppointmentType, IVideoMeetingProvider } from './types';
import { ManualMeetingProvider } from './manualProvider';
import { GoogleMeetProvider } from './googleMeetProvider';
import { MicrosoftTeamsProvider } from './msTeamsProvider';
import { ZoomProvider } from './zoomProvider';

export * from './types';
export * from './manualProvider';
export * from './googleMeetProvider';
export * from './msTeamsProvider';
export * from './zoomProvider';

export function getVideoMeetingProvider(type: AppointmentType): IVideoMeetingProvider {
  switch (type) {
    case 'google_meet':
      return new GoogleMeetProvider();
    case 'ms_teams':
      return new MicrosoftTeamsProvider();
    case 'zoom':
      return new ZoomProvider();
    case 'telephone':
    case 'in_person':
    case 'on_site':
    default:
      return new ManualMeetingProvider(type);
  }
}
