import { IEmailProvider, EmailDispatchResult, escapeHtml } from './types';
import { EnquiryRecord } from '../../database/enquiryRepo';

export class ResendEmailProvider implements IEmailProvider {
  private apiKey: string;
  private fromAddress: string;
  private toAddress: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    // Standardize sender: use configured EMAIL_FROM or Resend sandbox default if not verified
    this.fromAddress = process.env.EMAIL_FROM || 'Laurrel Dispatch <onboarding@resend.dev>';
    // Standardize recipient: prefer ENQUIRY_TO_EMAIL with fallback to DISPATCH_EMAIL_TO
    this.toAddress = process.env.ENQUIRY_TO_EMAIL || process.env.DISPATCH_EMAIL_TO || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
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

    const safeServices = record.services.map((s) => escapeHtml(s.toUpperCase())).join(', ');
    const safeName = escapeHtml(record.customer.name);
    const safeEmail = escapeHtml(record.customer.email);
    const safePhone = escapeHtml(record.customer.phone || 'Not provided');
    const safeLocation = escapeHtml(record.serviceLocation || 'Not provided');
    const safeTiming = escapeHtml(record.preferredTiming || 'Not provided');
    const safeIntent = escapeHtml(record.intent);
    const safeSource = escapeHtml(record.source);
    const safeDetails = escapeHtml(record.details);
    const safeId = escapeHtml(record.id);

    const subject = `[Laurrel Enquiry - ${record.id}] ${record.services.map((s) => s.toUpperCase()).join(', ')} - ${record.customer.name}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #202024;">
        <div style="background: #390044; padding: 22px; border-radius: 8px 8px 0 0; color: #FFFFFF;">
          <h2 style="margin: 0; color: #FE6000; font-size: 20px; font-weight: bold;">New Laurrel Services Customer Enquiry</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #F8F7F4;">Reference: ${safeId}</p>
        </div>
        <div style="background: #FFFFFF; padding: 24px; border: 1px solid #E5E5E5; border-top: none; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 6px 0; width: 140px; font-weight: bold; color: #575757;">Intent:</td>
              <td style="padding: 6px 0;">${safeIntent}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #575757;">Source:</td>
              <td style="padding: 6px 0;">${safeSource}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #575757;">Customer Name:</td>
              <td style="padding: 6px 0; font-weight: bold;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #575757;">Email:</td>
              <td style="padding: 6px 0;"><a href="mailto:${safeEmail}" style="color: #390044; text-decoration: underline;">${safeEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #575757;">Phone:</td>
              <td style="padding: 6px 0;">${safePhone}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #575757;">Services Requested:</td>
              <td style="padding: 6px 0; color: #390044; font-weight: bold;">${safeServices}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #575757;">Service Location:</td>
              <td style="padding: 6px 0;">${safeLocation}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #575757;">Preferred Timing:</td>
              <td style="padding: 6px 0;">${safeTiming}</td>
            </tr>
          </table>

          <div style="background: #F8F7F4; border-left: 4px solid #FE6000; padding: 14px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0 0 6px; font-weight: bold; color: #390044;">Job Details & Requirements:</p>
            <p style="margin: 0; white-space: pre-wrap; font-size: 14px;">${safeDetails}</p>
          </div>

          ${
            record.serviceDetails
              ? `<div style="background: #FAFAFA; border: 1px solid #EAEAEA; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
                  <p style="margin: 0 0 6px; font-weight: bold; font-size: 12px; color: #575757;">Service Specific Parameters:</p>
                  <pre style="margin: 0; font-size: 11px; white-space: pre-wrap;">${escapeHtml(JSON.stringify(record.serviceDetails, null, 2))}</pre>
                </div>`
              : ''
          }

          <div style="font-size: 11px; color: #888888; border-top: 1px solid #EEEEEE; padding-top: 12px; margin-top: 24px;">
            <p style="margin: 0;">Laurrel Dispatch Notification System · Generated at ${escapeHtml(record.createdAt)}</p>
            <p style="margin: 2px 0 0;">Reply-To: ${safeEmail}</p>
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

    const safeName = escapeHtml(record.customer.name);
    const safeServices = record.services.map((s) => escapeHtml(s.charAt(0).toUpperCase() + s.slice(1))).join(' & ');
    const safeId = escapeHtml(record.id);

    const subject = `Your Laurrel Services Enquiry Reference [${record.id}]`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; line-height: 1.6; color: #202024;">
        <div style="background: #390044; padding: 24px; border-radius: 8px 8px 0 0; color: #FFFFFF;">
          <h2 style="margin: 0; color: #FE6000; font-size: 20px; font-weight: bold;">Laurrel Services</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #F8F7F4;">Cleaning · Moving · Storage in Ottawa</p>
        </div>
        <div style="background: #FFFFFF; padding: 24px; border: 1px solid #E5E5E5; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hello ${safeName},</p>
          <p>Thank you for contacting Laurrel Services. We have received your enquiry for <strong>${safeServices}</strong>.</p>
          
          <div style="background: #F8F7F4; border-left: 4px solid #FE6000; border-radius: 4px; padding: 14px; margin: 20px 0;">
            <p style="margin: 0 0 4px; font-size: 13px; color: #575757;">Enquiry Reference:</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #390044;">${safeId}</p>
          </div>

          <h3 style="color: #390044; font-size: 15px; margin-top: 20px;">What happens next?</h3>
          <p style="font-size: 14px;">Our Ottawa dispatch team will review your requirements. We will follow up directly via email or phone with your tailored quotation and scheduling confirmation.</p>
          
          <p style="font-size: 14px; margin-top: 24px;">Warm regards,<br /><strong>Laurrel Services Team</strong><br /><span style="font-size: 12px; color: #666;">Ottawa, Ontario</span></p>
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

  async sendPasswordResetEmail(email: string, resetLink: string, userName?: string): Promise<EmailDispatchResult> {
    if (!this.apiKey) {
      return { success: false, provider: 'resend', error: 'RESEND_API_KEY is not configured' };
    }

    const safeName = escapeHtml(userName || 'Administrator');
    const safeEmail = escapeHtml(email);
    const safeLink = escapeHtml(resetLink);
    const subject = 'Reset your Laurrel Operations Administrator Password';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; line-height: 1.6; color: #202024; background-color: #F8F7F4; padding: 24px;">
        <div style="background: #390044; padding: 26px 28px; border-radius: 12px 12px 0 0; color: #FFFFFF; text-align: left;">
          <h2 style="margin: 0; color: #FE6000; font-size: 20px; font-weight: bold; letter-spacing: -0.02em;">LAURREL SERVICES</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #F8F7F4;">Operations & Administration Portal</p>
        </div>
        <div style="background: #FFFFFF; padding: 32px 28px; border: 1px solid #E5E5E5; border-top: none; border-radius: 0 0 12px 12px;">
          <h3 style="margin: 0 0 16px; font-size: 17px; color: #202024; font-weight: 600;">Password Reset Request</h3>
          <p style="margin: 0 0 14px; font-size: 14px; color: #575757;">Hello ${safeName},</p>
          <p style="margin: 0 0 20px; font-size: 14px; color: #575757; line-height: 1.6;">
            We received a request to reset the password for your Laurrel administrator account (<strong style="color: #202024;">${safeEmail}</strong>).
          </p>

          <div style="margin: 28px 0; text-align: left;">
            <a href="${safeLink}" style="display: inline-block; background: #390044; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 13px 26px; border-radius: 8px; border: 1px solid #280030;">
              Reset Administrator Password
            </a>
          </div>

          <div style="background: #FFF8F0; border-left: 4px solid #FE6000; border-radius: 4px; padding: 14px; margin: 24px 0;">
            <p style="margin: 0; font-size: 12px; color: #7A3500; line-height: 1.5;">
              <strong>Security Notice:</strong> This link is single-use and will expire in <strong>30 minutes</strong>. If you did not initiate this request, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>

          <p style="margin: 20px 0 0; font-size: 12px; color: #888888; word-break: break-all;">
            If the button above does not work, copy and paste this link into your browser:<br />
            <a href="${safeLink}" style="color: #390044; text-decoration: underline;">${safeLink}</a>
          </p>

          <div style="font-size: 11px; color: #888888; border-top: 1px solid #EEEEEE; padding-top: 16px; margin-top: 28px;">
            <p style="margin: 0;">Laurrel Services • Ottawa Operations</p>
            <p style="margin: 4px 0 0;">This is an automated operational notification. Please do not reply directly to this email.</p>
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
          to: email,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Resend Error]: HTTP failure while sending reset email', response.status, errorText);
        return { success: false, provider: 'resend', error: `HTTP ${response.status}: ${errorText}` };
      }

      const data = (await response.json()) as any;
      return { success: true, provider: 'resend', messageId: data.id };
    } catch (err: any) {
      console.error('[Resend Error]: Failed to send reset email', err.message);
      return { success: false, provider: 'resend', error: err.message };
    }
  }

  async sendAppointmentInvitation(data: import('./types').AppointmentEmailData): Promise<EmailDispatchResult> {
    if (!this.apiKey) {
      return { success: false, provider: 'resend', error: 'RESEND_API_KEY is not configured' };
    }

    const safeName = escapeHtml(data.customerName);
    const safeTitle = escapeHtml(data.title);
    const safePurpose = escapeHtml(data.purpose || data.title);
    const safeType = escapeHtml(data.appointmentType.replace(/_/g, ' ').toUpperCase());
    const safeLocation = escapeHtml(data.locationOrLink || 'Telephone / Location details to be confirmed');
    const safeStaff = escapeHtml(data.assignedStaffName || 'Laurrel Operations Team');
    const safeId = escapeHtml(data.appointmentId);

    const formattedTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(data.scheduledStart));

    const isPending = data.status === 'pending';
    const subject = isPending
      ? `Pending Confirmation: Laurrel Consultation — ${data.title}`
      : `Confirmed: Laurrel Consultation — ${data.title}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; line-height: 1.6; color: #202024; background-color: #F8F7F4; padding: 24px;">
        <div style="background: #390044; padding: 26px 28px; border-radius: 12px 12px 0 0; color: #FFFFFF; text-align: left;">
          <h2 style="margin: 0; color: #FE6000; font-size: 20px; font-weight: bold; letter-spacing: -0.02em;">LAURREL SERVICES</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #F8F7F4;">${isPending ? 'Ottawa Consultation Request Received' : 'Ottawa Consultation Confirmation'}</p>
        </div>
        <div style="background: #FFFFFF; padding: 32px 28px; border: 1px solid #E5E5E5; border-top: none; border-radius: 0 0 12px 12px;">
          <h3 style="margin: 0 0 14px; font-size: 18px; color: #202024; font-weight: 600;">${isPending ? 'Your consultation request has been received' : 'Your consultation is confirmed'}</h3>
          <p style="margin: 0 0 16px; font-size: 14px; color: #575757;">Hello ${safeName},</p>
          <p style="margin: 0 0 20px; font-size: 14px; color: #575757; line-height: 1.6;">
            ${isPending
              ? 'We have received your consultation booking request for Laurrel Services. A member of our Ottawa operations team is reviewing your schedule request and will confirm shortly.'
              : 'We have scheduled your consultation with Laurrel Services. Below are the confirmed appointment details:'}
          </p>

          <div style="background: #F8F7F4; border-left: 4px solid #390044; border-radius: 6px; padding: 18px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #575757; width: 130px;">Status:</td>
                <td style="padding: 5px 0;">${isPending ? '<span style="color: #B45309; background: #FEF3C7; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">PENDING CONFIRMATION</span>' : '<span style="color: #047857; background: #D1FAE5; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">CONFIRMED</span>'}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #575757;">Purpose:</td>
                <td style="padding: 5px 0; color: #202024; font-weight: 600;">${safeTitle}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #575757;">Date & Time:</td>
                <td style="padding: 5px 0; color: #390044; font-weight: bold;">${formattedTime} (Ottawa Time)</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #575757;">Duration:</td>
                <td style="padding: 5px 0; color: #202024;">${data.durationMinutes} minutes</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #575757;">Consultation Type:</td>
                <td style="padding: 5px 0; color: #202024;">${safeType}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #575757;">Joining / Location:</td>
                <td style="padding: 5px 0; color: #202024; word-break: break-all;">${safeLocation}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #575757;">Assigned Coordinator:</td>
                <td style="padding: 5px 0; color: #202024;">${safeStaff}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #666666; margin-top: 24px;">
            If you need to reschedule or have questions before our meeting, please contact our Ottawa dispatch team at <a href="mailto:info@laurrelservices.ca" style="color: #390044; font-weight: 600;">info@laurrelservices.ca</a> referencing appointment <strong>${safeId}</strong>.
          </p>

          <div style="font-size: 11px; color: #888888; border-top: 1px solid #EEEEEE; padding-top: 16px; margin-top: 28px;">
            <p style="margin: 0;">Laurrel Services • Ottawa, Ontario</p>
            <p style="margin: 4px 0 0;">Cleaning · Moving · Storage Operations</p>
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
          to: data.customerEmail,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, provider: 'resend', error: `HTTP ${response.status}: ${errorText}` };
      }

      const resData = (await response.json()) as any;
      return { success: true, provider: 'resend', messageId: resData.id };
    } catch (err: any) {
      return { success: false, provider: 'resend', error: err.message };
    }
  }

  async sendAppointmentUpdate(
    data: import('./types').AppointmentEmailData,
    changeType: 'rescheduled' | 'cancelled'
  ): Promise<EmailDispatchResult> {
    if (!this.apiKey) {
      return { success: false, provider: 'resend', error: 'RESEND_API_KEY is not configured' };
    }

    const safeName = escapeHtml(data.customerName);
    const safeTitle = escapeHtml(data.title);
    const safeReason = escapeHtml(data.cancellationReason || 'Requested schedule update');
    const isCancelled = changeType === 'cancelled';
    const safeSubject = isCancelled
      ? `Cancelled: Laurrel Consultation — ${data.title}`
      : `Rescheduled: Laurrel Consultation — ${data.title}`;

    const formattedTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(data.scheduledStart));

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; line-height: 1.6; color: #202024; background-color: #F8F7F4; padding: 24px;">
        <div style="background: #390044; padding: 26px 28px; border-radius: 12px 12px 0 0; color: #FFFFFF; text-align: left;">
          <h2 style="margin: 0; color: #FE6000; font-size: 20px; font-weight: bold;">LAURREL SERVICES</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #F8F7F4;">Appointment Update</p>
        </div>
        <div style="background: #FFFFFF; padding: 32px 28px; border: 1px solid #E5E5E5; border-top: none; border-radius: 0 0 12px 12px;">
          <h3 style="margin: 0 0 14px; font-size: 18px; color: #202024; font-weight: 600;">
            ${isCancelled ? 'Consultation Cancelled' : 'Consultation Rescheduled'}
          </h3>
          <p style="margin: 0 0 16px; font-size: 14px; color: #575757;">Hello ${safeName},</p>
          <p style="margin: 0 0 20px; font-size: 14px; color: #575757; line-height: 1.6;">
            ${
              isCancelled
                ? `Your consultation for <strong>${safeTitle}</strong> has been cancelled.`
                : `Your consultation for <strong>${safeTitle}</strong> has been updated to <strong>${formattedTime}</strong>.`
            }
          </p>

          <div style="background: #FFF8F0; border-left: 4px solid #FE6000; border-radius: 6px; padding: 14px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #7A3500;">
              <strong>Note:</strong> ${safeReason}
            </p>
          </div>

          <p style="font-size: 13px; color: #666666; margin-top: 24px;">
            Please contact our dispatch team at <a href="mailto:info@laurrelservices.ca" style="color: #390044; font-weight: 600;">info@laurrelservices.ca</a> if you would like to book a new appointment or modify your request.
          </p>
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
          to: data.customerEmail,
          subject: safeSubject,
          html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, provider: 'resend', error: `HTTP ${response.status}: ${errorText}` };
      }

      const resData = (await response.json()) as any;
      return { success: true, provider: 'resend', messageId: resData.id };
    } catch (err: any) {
      return { success: false, provider: 'resend', error: err.message };
    }
  }
}
