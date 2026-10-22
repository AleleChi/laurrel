import { EnquiryRecord } from '../../database/enquiryRepo';

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  provider: 'resend' | 'smtp' | 'none';
  error?: string;
}

export interface AppointmentEmailData {
  appointmentId: string;
  enquiryId: string;
  customerName: string;
  customerEmail: string;
  title: string;
  purpose?: string | null;
  appointmentType: string;
  scheduledStart: string | Date;
  scheduledEnd: string | Date;
  durationMinutes: number;
  timezone: string;
  locationOrLink?: string | null;
  assignedStaffName?: string | null;
  cancellationReason?: string | null;
}

export interface IEmailProvider {
  isConfigured(): boolean;
  sendEnquiryNotification(record: EnquiryRecord): Promise<EmailDispatchResult>;
  sendCustomerAcknowledgement(record: EnquiryRecord): Promise<EmailDispatchResult>;
  sendPasswordResetEmail(email: string, resetLink: string, userName?: string): Promise<EmailDispatchResult>;
  sendAppointmentInvitation(data: AppointmentEmailData): Promise<EmailDispatchResult>;
  sendAppointmentUpdate(data: AppointmentEmailData, changeType: 'rescheduled' | 'cancelled'): Promise<EmailDispatchResult>;
}

/**
 * Escapes unsafe characters for HTML email templates to prevent XSS / HTML injection
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
