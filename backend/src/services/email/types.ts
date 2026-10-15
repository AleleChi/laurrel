import { EnquiryRecord } from '../../database/enquiryRepo';

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  provider: 'resend' | 'smtp' | 'none';
  error?: string;
}

export interface IEmailProvider {
  sendEnquiryNotification(record: EnquiryRecord): Promise<EmailDispatchResult>;
  sendCustomerAcknowledgement(record: EnquiryRecord): Promise<EmailDispatchResult>;
}
