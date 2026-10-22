export type AppointmentType =
  | 'telephone'
  | 'in_person'
  | 'on_site'
  | 'google_meet'
  | 'ms_teams'
  | 'zoom';

export interface MeetingRequest {
  title: string;
  purpose?: string;
  appointmentType: AppointmentType;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  staffName?: string;
  staffEmail?: string;
  locationOrLink?: string;
}

export interface MeetingDetails {
  providerType: AppointmentType;
  joinUrl?: string;
  hostUrl?: string; // Host control link — kept strictly for staff, never sent to customers
  meetingId?: string;
  passcode?: string;
  phoneDialIn?: string;
  location?: string;
  isAutomated: boolean;
  notes?: string;
}

export interface IVideoMeetingProvider {
  readonly providerType: AppointmentType;
  isConfigured(): boolean;
  createMeeting(request: MeetingRequest): Promise<MeetingDetails>;
}
