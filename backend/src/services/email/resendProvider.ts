import { IEmailProvider, EmailDispatchResult } from './types';
import { EnquiryRecord } from '../../database/enquiryRepo';

export class ResendEmailProvider implements IEmailProvider {
  private apiKey: string;
  private fromAddress: string;
  private toAddress: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromAddress = process.env.EMAIL_FROM || 'Laurrel Dispatch <onboarding@resend.dev>';
    this.toAddress = process.env.ENQUIRY_TO_EMAIL || process.env.DISPATCH_EMAIL_TO || '';
  }

  async sendEnquiryNotification(record: EnquiryRecord): Promise<EmailDispatchResult> {
    if (!this.apiKey) {
      console.warn('[Resend Provider] RESEND_API_KEY not configured. Skipping live email dispatch.');
      return { success: false, provider: 'resend', error: 'RESEND_API_KEY is not configured' };
    }

    if (!this.toAddress) {
      console.warn('[Resend Provider] ENQUIRY_TO_EMAIL destination is not configured. Skipping live email dispatch.');
      return { success: false, provider: 'resend', error: 'ENQUIRY_TO_EMAIL destination is not configured' };
    }

    const servicesLabel = record.services.map((s) => s.toUpperCase()).join(', ');
    const subject = `[Laurrel Enquiry - ${record.id}] ${servicesLabel} - ${record.customer.name}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #202024;">
        <div style="background: #390044; padding: 20px; border-radius: 8px 8px 0 0; color: #FFFFFF;">
          <h2 style="margin: 0; color: #C8E80B; font-size: 20px;">New Laurrel Services Customer Enquiry</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #F8F7F4;">Reference: ${record.id}</p>
        </div>
        <div style="background: #FFFFFF; padding: 24px; border: 1px solid #E5E5E5; border-top: none; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 6px 0; width: 140px; font-weight: bold; color: #575757;">Intent:</td>
              <td style="padding: 6px 0;">${record.intent}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #575757;">Source:</td>
              <td style="padding: 6px 0;">${record.source}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #575757;">Customer Name:</td>
              <td style="padding: 6px 0; font-weight: bold;">${record.customer.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #575757;">Email:</td>
              <td style="padding: 6px 0;"><a href="mailto:${record.customer.email}">${record.customer.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #575757;">Phone:</td>
              <td style="padding: 6px 0;">${record.customer.phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #575757;">Services Requested:</td>
              <td style="padding: 6px 0; color: #390044; font-weight: bold;">${servicesLabel}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #575757;">Service Location:</td>
              <td style="padding: 6px 0;">${record.serviceLocation || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #575757;">Preferred Date / Timing:</td>
              <td style="padding: 6px 0;">${record.preferredTiming || 'Not provided'}</td>
            </tr>
          </table>

          <div style="background: #F8F7F4; border-left: 4px solid #C8E80B; padding: 14px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0 0 6px; font-weight: bold; color: #390044;">Job Details & Requirements:</p>
            <p style="margin: 0; white-space: pre-wrap; font-size: 14px;">${record.details}</p>
          </div>

          ${
            record.serviceDetails
              ? `<div style="background: #FAFAFA; border: 1px solid #EAEAEA; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
                  <p style="margin: 0 0 6px; font-weight: bold; font-size: 12px; color: #575757;">Service Specific Parameters:</p>
                  <pre style="margin: 0; font-size: 11px; white-space: pre-wrap;">${JSON.stringify(record.serviceDetails, null, 2)}</pre>
                </div>`
              : ''
          }

          <div style="font-size: 11px; color: #888888; border-top: 1px solid #EEEEEE; padding-top: 12px; margin-top: 24px;">
            <p style="margin: 0;">Laurrel Dispatch Notification System · Generated at ${record.createdAt}</p>
            <p style="margin: 2px 0 0;">Replying directly to this email will reply to: ${record.customer.email}</p>
          </div>
        </div>
      </div>
    `;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: this.toAddress,
          reply_to: record.customer.email,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Resend Error]: HTTP failure', response.status, errorText);
        return { success: false, provider: 'resend', error: `HTTP ${response.status}: ${errorText}` };
      }

      const data = (await response.json()) as any;
      return { success: true, provider: 'resend', messageId: data.id };
    } catch (err: any) {
      console.error('[Resend Error]: Request failed', err.message);
      return { success: false, provider: 'resend', error: err.message };
    }
  }

  async sendCustomerAcknowledgement(record: EnquiryRecord): Promise<EmailDispatchResult> {
    if (!this.apiKey || !record.customer.email) {
      return { success: false, provider: 'resend', error: 'Cannot send customer acknowledgement' };
    }

    const servicesLabel = record.services.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' & ');
    const subject = `Your Laurrel Services Enquiry Reference [${record.id}]`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; line-height: 1.6; color: #202024;">
        <div style="background: #390044; padding: 24px; border-radius: 8px 8px 0 0; color: #FFFFFF;">
          <h2 style="margin: 0; color: #C8E80B; font-size: 20px;">Laurrel Services</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #F8F7F4;">Cleaning · Moving · Storage in Ottawa</p>
        </div>
        <div style="background: #FFFFFF; padding: 24px; border: 1px solid #E5E5E5; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hello ${record.customer.name},</p>
          <p>Thank you for contacting Laurrel Services. We have received your enquiry for <strong>${servicesLabel}</strong>.</p>
          
          <div style="background: #F8F7F4; border: 1px solid #EAEAEA; padding: 14px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 4px; font-size: 13px; color: #575757;">Enquiry Reference:</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #390044;">${record.id}</p>
          </div>

          <h3 style="color: #390044; font-size: 15px; margin-top: 20px;">What happens next?</h3>
          <p style="font-size: 14px;">Our Ottawa team will review the details you provided regarding your property and dates. We will follow up with you directly via email or phone to provide a tailored quote and confirm schedule details.</p>
          
          <p style="font-size: 14px; margin-top: 24px;">Warm regards,<br /><strong>Laurrel Services Team</strong><br /><span style="font-size: 12px; color: #666;">Ottawa, Ontario · <a href="https://laurrelservices.ca">laurrelservices.ca</a></span></p>
        </div>
      </div>
    `;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: record.customer.email,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        return { success: false, provider: 'resend', error: `HTTP ${response.status}` };
      }

      const data = (await response.json()) as any;
      return { success: true, provider: 'resend', messageId: data.id };
    } catch (err: any) {
      return { success: false, provider: 'resend', error: err.message };
    }
  }
}
