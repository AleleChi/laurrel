import nodemailer from 'nodemailer';
import { IEmailProvider, EmailDispatchResult, escapeHtml } from './types';
import { EnquiryRecord } from '../../database/enquiryRepo';

export class SmtpEmailProvider implements IEmailProvider {
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string;
  private toAddress: string;

  constructor() {
    this.fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || '';
    // Standardize recipient: prefer ENQUIRY_TO_EMAIL with fallback to DISPATCH_EMAIL_TO
    this.toAddress = process.env.ENQUIRY_TO_EMAIL || process.env.DISPATCH_EMAIL_TO || '';

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
    }
  }

  isConfigured(): boolean {
    return Boolean(this.transporter);
  }

  async sendEnquiryNotification(record: EnquiryRecord): Promise<EmailDispatchResult> {
    if (!this.transporter) {
      console.warn('[SMTP Provider] SMTP credentials not fully configured. Skipping dispatch.');
      return { success: false, provider: 'smtp', error: 'SMTP configuration incomplete' };
    }

    if (!this.toAddress) {
      console.warn('[SMTP Provider] ENQUIRY_TO_EMAIL destination not configured. Skipping dispatch.');
      return { success: false, provider: 'smtp', error: 'ENQUIRY_TO_EMAIL destination not configured' };
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
            <tr><td style="padding: 6px 0; width: 140px; font-weight: bold; color: #575757;">Intent:</td><td style="padding: 6px 0;">${safeIntent}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #575757;">Source:</td><td style="padding: 6px 0;">${safeSource}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #575757;">Customer Name:</td><td style="padding: 6px 0; font-weight: bold;">${safeName}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #575757;">Email:</td><td style="padding: 6px 0;"><a href="mailto:${safeEmail}" style="color: #390044; text-decoration: underline;">${safeEmail}</a></td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #575757;">Phone:</td><td style="padding: 6px 0;">${safePhone}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #575757;">Services:</td><td style="padding: 6px 0; color: #390044; font-weight: bold;">${safeServices}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #575757;">Location:</td><td style="padding: 6px 0;">${safeLocation}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #575757;">Preferred Timing:</td><td style="padding: 6px 0;">${safeTiming}</td></tr>
          </table>

          <div style="background: #F8F7F4; border-left: 4px solid #FE6000; padding: 14px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0 0 6px; font-weight: bold; color: #390044;">Job Details & Requirements:</p>
            <p style="margin: 0; white-space: pre-wrap; font-size: 14px;">${safeDetails}</p>
          </div>

          <div style="font-size: 11px; color: #888888; border-top: 1px solid #EEEEEE; padding-top: 12px; margin-top: 24px;">
            <p style="margin: 0;">Laurrel Dispatch Notification System (SMTP) · ${escapeHtml(record.createdAt)}</p>
            <p style="margin: 2px 0 0;">Reply-To: ${safeEmail}</p>
          </div>
        </div>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: this.toAddress,
        replyTo: record.customer.email,
        subject,
        html,
      });

      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (err: any) {
      console.error('[SMTP Error]: Could not send notification email', err.message);
      return { success: false, provider: 'smtp', error: err.message };
    }
  }

  async sendCustomerAcknowledgement(record: EnquiryRecord): Promise<EmailDispatchResult> {
    if (!this.transporter || !record.customer.email) {
      return { success: false, provider: 'smtp', error: 'Cannot send customer acknowledgement' };
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
          <p style="font-size: 14px;">Our Ottawa dispatch team will review your requirements and follow up directly via email or phone with your tailored quotation.</p>
          
          <p style="font-size: 14px; margin-top: 24px;">Warm regards,<br /><strong>Laurrel Services Team</strong><br /><span style="font-size: 12px; color: #666;">Ottawa, Ontario</span></p>
        </div>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: record.customer.email,
        subject,
        html,
      });

      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (err: any) {
      return { success: false, provider: 'smtp', error: err.message };
    }
  }

  async sendPasswordResetEmail(email: string, resetLink: string, userName?: string): Promise<EmailDispatchResult> {
    if (!this.transporter) {
      return { success: false, provider: 'smtp', error: 'SMTP credentials not configured' };
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
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject,
        html,
      });

      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (err: any) {
      console.error('[SMTP Error]: Failed to send reset email', err.message);
      return { success: false, provider: 'smtp', error: err.message };
    }
  }

  async sendAppointmentInvitation(data: import('./types').AppointmentEmailData): Promise<EmailDispatchResult> {
    if (!this.transporter) {
      return { success: false, provider: 'smtp', error: 'SMTP configuration incomplete' };
    }

    const safeName = escapeHtml(data.customerName);
    const safeTitle = escapeHtml(data.title);
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
        <div style="background: #390044; padding: 26px 28px; border-radius: 12px 12px 0 0; color: #FFFFFF;">
          <h2 style="margin: 0; color: #FE6000; font-size: 20px; font-weight: bold;">LAURREL SERVICES</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #F8F7F4;">${isPending ? 'Ottawa Consultation Request Received' : 'Ottawa Consultation Confirmation'}</p>
        </div>
        <div style="background: #FFFFFF; padding: 32px 28px; border: 1px solid #E5E5E5; border-top: none; border-radius: 0 0 12px 12px;">
          <h3 style="margin: 0 0 14px; font-size: 18px; color: #202024; font-weight: 600;">${isPending ? 'Your consultation request has been received' : 'Your consultation is confirmed'}</h3>
          <p style="margin: 0 0 16px; font-size: 14px; color: #575757;">Hello ${safeName},</p>
          <p style="margin: 0 0 20px; font-size: 14px; color: #575757;">
            ${isPending
              ? 'We have received your consultation booking request for Laurrel Services. A member of our Ottawa operations team is reviewing your schedule request and will confirm shortly.'
              : 'We have scheduled your consultation with Laurrel Services:'}
          </p>
          <div style="background: #F8F7F4; border-left: 4px solid #390044; border-radius: 6px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Status:</strong> ${isPending ? '<span style="color: #B45309; background: #FEF3C7; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">PENDING CONFIRMATION</span>' : '<span style="color: #047857; background: #D1FAE5; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">CONFIRMED</span>'}</p>
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Purpose:</strong> ${safeTitle}</p>
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Date & Time:</strong> ${formattedTime} (Ottawa Time)</p>
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Duration:</strong> ${data.durationMinutes} minutes</p>
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Type:</strong> ${safeType}</p>
            <p style="margin: 0 0 8px; font-size: 13px; word-break: break-all;"><strong>Location / Link:</strong> ${safeLocation}</p>
            <p style="margin: 0; font-size: 13px;"><strong>Coordinator:</strong> ${safeStaff}</p>
          </div>
          <p style="font-size: 13px; color: #666666; margin-top: 24px;">
            Questions or rescheduling? Contact us at <a href="mailto:info@laurrelservices.ca" style="color: #390044;">info@laurrelservices.ca</a> referencing ${safeId}.
          </p>
        </div>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: data.customerEmail,
        subject,
        html,
      });
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (err: any) {
      return { success: false, provider: 'smtp', error: err.message };
    }
  }

  async sendAppointmentUpdate(
    data: import('./types').AppointmentEmailData,
    changeType: 'rescheduled' | 'cancelled' | 'video_link_ready'
  ): Promise<EmailDispatchResult> {
    if (!this.transporter) {
      return { success: false, provider: 'smtp', error: 'SMTP configuration incomplete' };
    }

    const safeName = escapeHtml(data.customerName);
    const safeTitle = escapeHtml(data.title);
    const safeReason = escapeHtml(data.cancellationReason || 'Requested schedule update');
    const isCancelled = changeType === 'cancelled';
    const subject = isCancelled
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
        <div style="background: #390044; padding: 26px 28px; border-radius: 12px 12px 0 0; color: #FFFFFF;">
          <h2 style="margin: 0; color: #FE6000; font-size: 20px; font-weight: bold;">LAURREL SERVICES</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #F8F7F4;">Appointment Update</p>
        </div>
        <div style="background: #FFFFFF; padding: 32px 28px; border: 1px solid #E5E5E5; border-top: none; border-radius: 0 0 12px 12px;">
          <h3 style="margin: 0 0 14px; font-size: 18px; color: #202024; font-weight: 600;">
            ${isCancelled ? 'Consultation Cancelled' : 'Consultation Rescheduled'}
          </h3>
          <p style="margin: 0 0 16px; font-size: 14px; color: #575757;">Hello ${safeName},</p>
          <p style="margin: 0 0 20px; font-size: 14px; color: #575757;">
            ${
              isCancelled
                ? `Your consultation for <strong>${safeTitle}</strong> has been cancelled.`
                : `Your consultation for <strong>${safeTitle}</strong> has been rescheduled to <strong>${formattedTime}</strong>.`
            }
          </p>
          <p style="margin: 0; font-size: 13px; color: #7A3500;"><strong>Reason:</strong> ${safeReason}</p>
        </div>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: data.customerEmail,
        subject,
        html,
      });
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (err: any) {
      return { success: false, provider: 'smtp', error: err.message };
    }
  }
  async sendConferenceLinkReady(data: import('./types').AppointmentEmailData): Promise<EmailDispatchResult> {
    return this.sendAppointmentUpdate(data, 'video_link_ready');
  }
}
