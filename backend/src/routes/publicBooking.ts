import { Router, Request, Response, NextFunction } from 'express';
import { getDbPool } from '../database/pool';
import { getAppointmentSettings } from '../database/settingsRepo';
import { getProviderIntegration } from '../database/integrationRepo';
import { getAvailableSlots, validateBookingSlot } from '../services/appointments/availabilityEngine';
import { generateManagementToken } from '../services/security/crypto';
import {
  createGoogleMeetEvent,
  deleteGoogleCalendarEvent,
  rescheduleGoogleCalendarEvent,
} from '../services/video/googleCalendarClient';
import { generateIcsInvitation } from '../services/appointments/icsGenerator';
import { getEmailProvider } from '../services/email';

export const publicBookingRouter = Router();

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitEntry>();

function publicRateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Exclude automated test suites from rate limits
    if (process.env.NODE_ENV === 'test') {
      next();
      return;
    }

    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const key = `${req.path}:${clientIp}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      next();
    } else if (entry.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many booking requests from this connection. Please wait a few moments before trying again.',
      });
    } else {
      entry.count++;
      next();
    }
  };
}

function getCanonicalPublicSiteUrl(): string {
  const configured =
    process.env.PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://laurrel.ca';
  return configured.replace(/\/$/, '');
}

// ============================================================================
// 1. PUBLIC CONFIGURATION
// ============================================================================
publicBookingRouter.get(
  '/api/public/appointments/config',
  publicRateLimit(60, 60000),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const settings = await getAppointmentSettings();
      const googleIntegration = await getProviderIntegration('google_meet');

      const isGoogleMeetActive =
        googleIntegration?.status === 'connected' &&
        Boolean(googleIntegration.credentials?.refreshToken);

      res.json({
        success: true,
        allowedChannels: settings.allowedChannels,
        slotDurationMinutes: settings.slotDurationMinutes,
        minNoticeHours: settings.minNoticeHours,
        maxBookingDays: settings.maxBookingDays,
        timeZone: 'America/Toronto',
        isGoogleMeetActive,
        channelInstructions: settings.channelInstructions,
      });
    } catch (err: any) {
      console.error('[Public Booking Config Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve booking configuration.' });
    }
  }
);

// ============================================================================
// 2. PUBLIC AVAILABILITY
// ============================================================================
publicBookingRouter.get(
  '/api/public/appointments/availability',
  publicRateLimit(60, 60000),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { date, type, timezone } = req.query;

      if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({ success: false, error: 'A valid date parameter in YYYY-MM-DD format is required.' });
        return;
      }

      const appointmentType = typeof type === 'string' ? type.trim().toLowerCase() : 'telephone';
      const customerTimezone = typeof timezone === 'string' && timezone.trim() ? timezone.trim() : 'America/Toronto';

      // Validate customer timezone string
      try {
        Intl.DateTimeFormat(undefined, { timeZone: customerTimezone });
      } catch {
        res.status(400).json({ success: false, error: 'Invalid customer timezone identifier.' });
        return;
      }

      const result = await getAvailableSlots(date, appointmentType, customerTimezone);
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[Public Availability Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve available appointment times.' });
    }
  }
);

// ============================================================================
// 3. BOOK APPOINTMENT (ATOMIC RESERVATION + COMPREHENSIVE VALIDATION)
// ============================================================================
publicBookingRouter.post(
  '/api/public/appointments/book',
  publicRateLimit(10, 600000),
  async (req: Request, res: Response): Promise<void> => {
    const pool = getDbPool();
    if (!pool) {
      res.status(500).json({ success: false, error: 'Persistence layer unavailable.' });
      return;
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      appointmentType,
      startUtc,
      customerTimezone,
      serviceAddress,
      customerNotes,
      idempotencyKey,
    } = req.body;

    // Strict Input Validation
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0 || customerName.length > 100) {
      res.status(400).json({ success: false, error: 'Valid customer name is required (max 100 characters).' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail || typeof customerEmail !== 'string' || !emailRegex.test(customerEmail.trim()) || customerEmail.length > 255) {
      res.status(400).json({ success: false, error: 'A valid customer email address is required (max 255 characters).' });
      return;
    }

    if (customerPhone && (typeof customerPhone !== 'string' || customerPhone.length > 30)) {
      res.status(400).json({ success: false, error: 'Telephone number exceeds maximum length (30 characters).' });
      return;
    }

    if (serviceAddress && (typeof serviceAddress !== 'string' || serviceAddress.length > 300)) {
      res.status(400).json({ success: false, error: 'Service address exceeds maximum length (300 characters).' });
      return;
    }

    if (customerNotes && (typeof customerNotes !== 'string' || customerNotes.length > 1000)) {
      res.status(400).json({ success: false, error: 'Customer notes exceed maximum length (1000 characters).' });
      return;
    }

    if (!startUtc || isNaN(new Date(startUtc).getTime())) {
      res.status(400).json({ success: false, error: 'A valid appointment start timestamp is required.' });
      return;
    }

    const type = (appointmentType || 'telephone').trim().toLowerCase();
    const validChannels = ['telephone', 'google_meet', 'on_site', 'in_person'];
    if (!validChannels.includes(type)) {
      res.status(400).json({ success: false, error: `Invalid consultation channel: ${type}` });
      return;
    }

    // Validate customer timezone identifier
    const clientTz = customerTimezone && typeof customerTimezone === 'string' ? customerTimezone.trim() : 'America/Toronto';
    try {
      Intl.DateTimeFormat(undefined, { timeZone: clientTz });
    } catch {
      res.status(400).json({ success: false, error: 'Invalid customer timezone identifier.' });
      return;
    }

    const settings = await getAppointmentSettings();

    // Check Google Meet Active Provider Status
    if (type === 'google_meet') {
      const googleInt = await getProviderIntegration('google_meet');
      if (!googleInt || googleInt.status !== 'connected' || !googleInt.credentials?.refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Google Meet video consultations are temporarily offline. Please select a Telephone or On-Site consultation.',
        });
        return;
      }
    }

    const start = new Date(startUtc);

    // Enforce Comprehensive Availability Rules (Operating days/hours, horizon, notice, boundaries, external busy)
    const slotValidation = await validateBookingSlot({
      start,
      appointmentType: type,
      settings,
    });

    if (!slotValidation.valid) {
      res.status(400).json({
        success: false,
        error: slotValidation.error || 'The requested appointment time slot does not meet scheduling rules.',
      });
      return;
    }

    const durationMinutes = settings.slotDurationMinutes || 30;
    const bufferMinutes = settings.bufferMinutes || 15;
    const end = new Date(start.getTime() + durationMinutes * 60000);

    const client = await pool.connect();
    let clientReleased = false;
    let appointmentRecord: any = null;
    let enquiryId: string | null = null;
    const managementToken = generateManagementToken();
    const resolvedIdempKey = idempotencyKey || `idemp_pub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    try {
      await client.query('BEGIN');

      // 1. Check idempotency replay with strict customer matching
      if (idempotencyKey) {
        const existingRes = await client.query(
          'SELECT * FROM appointments WHERE idempotency_key = $1 LIMIT 1',
          [idempotencyKey]
        );
        if (existingRes.rows.length > 0) {
          const existing = existingRes.rows[0];
          // Ensure idempotency key cannot be used to retrieve another customer's consultation
          if (existing.customer_email.toLowerCase() !== customerEmail.trim().toLowerCase()) {
            await client.query('ROLLBACK');
            res.status(409).json({
              success: false,
              error: 'Supplied idempotency key belongs to another consultation.',
            });
            return;
          }

          await client.query('COMMIT');
          res.status(200).json({
            success: true,
            replayed: true,
            appointment: {
              id: existing.id,
              title: existing.title,
              scheduledStart: existing.scheduled_start,
              scheduledEnd: existing.scheduled_end,
              appointmentType: existing.appointment_type,
              locationOrLink: existing.location_or_link,
              customerName: existing.customer_name,
              customerEmail: existing.customer_email,
              assignedStaffName: existing.assigned_staff_name,
              status: existing.status,
              conferenceStatus: existing.conference_status || 'none',
              notificationSent: existing.notification_sent,
            },
            managementToken: existing.management_token,
          });
          return;
        }
      }

      // 2. Select eligible staff coordinator and lock row atomically
      const staffQuery = `
        SELECT id, name
        FROM admin_users
        WHERE role IN ('owner', 'admin', 'operations_staff')
        ORDER BY role = 'owner' DESC, name ASC
      `;
      const staffRes = await client.query(staffQuery);
      if (staffRes.rows.length === 0) {
        throw new Error('No staff coordinator available for assignment.');
      }

      let assignedStaff: { id: string; name: string } | null = null;
      const startWithBuffer = new Date(start.getTime() - bufferMinutes * 60000);
      const endWithBuffer = new Date(end.getTime() + bufferMinutes * 60000);

      for (const candidate of staffRes.rows) {
        // Serialize staff booking
        await client.query('SELECT id, name FROM admin_users WHERE id = $1 FOR UPDATE', [candidate.id]);

        // Check conflict in database with buffer interval
        const conflictRes = await client.query(
          `
          SELECT id
          FROM appointments
          WHERE assigned_staff_id = $1
            AND status NOT IN ('cancelled')
            AND scheduled_start < $3
            AND scheduled_end > $2
          LIMIT 1
          `,
          [candidate.id, startWithBuffer, endWithBuffer]
        );

        if (conflictRes.rows.length === 0) {
          assignedStaff = candidate;
          break;
        }
      }

      if (!assignedStaff) {
        await client.query('ROLLBACK');
        res.status(409).json({
          success: false,
          error: 'The requested time slot has just been reserved by another customer. Please select another available time.',
        });
        return;
      }

      // 3. Create linked customer enquiry in lead pipeline (email_delivered initially FALSE)
      enquiryId = `ENQ-BOOK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const serviceLabel = (serviceType || 'general').trim();
      const enquiryDetails = `Customer self-service consultation booked via Website Booking Portal.\nService: ${serviceLabel}\nFormat: ${type}\nNotes: ${customerNotes || 'None'}`;

      await client.query(
        `
        INSERT INTO enquiries (
          id, intent, source, customer_name, customer_email, customer_phone,
          services, service_location, details, status, email_delivered
        )
        VALUES ($1, 'scheduled_consultation', 'web_booking_portal', $2, $3, $4, $5, $6, $7, 'scheduled', FALSE)
        `,
        [
          enquiryId,
          customerName.trim(),
          customerEmail.trim(),
          customerPhone?.trim() || null,
          [serviceLabel],
          serviceAddress?.trim() || null,
          enquiryDetails,
        ]
      );

      // 4. Insert appointment record
      const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const title = `${serviceLabel.charAt(0).toUpperCase() + serviceLabel.slice(1)} Consultation — ${customerName.trim()}`;
      const initialLocation =
        type === 'telephone'
          ? (customerPhone?.trim() || 'Customer telephone number')
          : type === 'on_site'
          ? (serviceAddress?.trim() || 'Customer property location (Ottawa)')
          : type === 'in_person'
          ? 'Laurrel Services Office (Ottawa, ON)'
          : null;

      const initialConferenceStatus = type === 'google_meet' ? 'pending_details' : 'none';

      const insertAptQuery = `
        INSERT INTO appointments (
          id, enquiry_id, title, purpose, appointment_type, status,
          scheduled_start, scheduled_end, duration_minutes, timezone,
          customer_name, customer_email, customer_phone, location_or_link,
          assigned_staff_id, assigned_staff_name, staff_notes, notification_sent,
          idempotency_key, created_by, management_token, service_address,
          booking_source, customer_timezone, customer_notes, conference_status
        )
        VALUES (
          $1, $2, $3, $4, $5, 'confirmed',
          $6, $7, $8, 'America/Toronto',
          $9, $10, $11, $12,
          $13, $14, $15, FALSE,
          $16, $13, $17, $18,
          'public_self_service', $19, $20, $21
        )
        RETURNING *
      `;

      const aptRes = await client.query(insertAptQuery, [
        appointmentId,
        enquiryId,
        title,
        `Self-service booking for ${serviceLabel}`,
        type,
        start,
        end,
        durationMinutes,
        customerName.trim(),
        customerEmail.trim(),
        customerPhone?.trim() || null,
        initialLocation,
        assignedStaff.id,
        assignedStaff.name,
        customerNotes || null,
        resolvedIdempKey,
        managementToken,
        serviceAddress?.trim() || null,
        clientTz,
        customerNotes?.trim() || null,
        initialConferenceStatus,
      ]);

      appointmentRecord = aptRes.rows[0];

      // Audit activity
      await client.query(
        `
        INSERT INTO appointment_activity (id, appointment_id, action, performed_by, details, metadata)
        VALUES ($1, $2, 'created', 'Customer (Self-Service)', 'Appointment booked via public booking portal', $3)
        `,
        [
          `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          appointmentId,
          JSON.stringify({ channel: type, customerTimezone: clientTz, enquiryId }),
        ]
      );

      await client.query('COMMIT');
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[Public Booking Transaction Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to complete appointment booking. Please try again.' });
      return;
    } finally {
      if (!clientReleased) {
        clientReleased = true;
        client.release();
      }
    }

    // 5. Asynchronous External Provider Integration (Google Meet) without holding DB locks
    let finalJoinUrl: string | null = appointmentRecord.location_or_link;
    let resolvedConferenceStatus: 'ready' | 'pending_details' | 'failed' | 'none' = 'none';

    if (type === 'google_meet') {
      try {
        const meetResult = await createGoogleMeetEvent({
          title: appointmentRecord.title,
          description: appointmentRecord.purpose,
          scheduledStartIso: start.toISOString(),
          scheduledEndIso: end.toISOString(),
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          requestId: resolvedIdempKey,
        });

        finalJoinUrl = meetResult.joinUrl;
        resolvedConferenceStatus = meetResult.conferenceStatus;

        // Update database with verified meeting details and conference status
        await pool.query(
          `
          UPDATE appointments
          SET
            location_or_link = $1,
            calendar_event_id = $2,
            conference_status = $3,
            conference_id = $4,
            updated_at = NOW()
          WHERE id = $5
          `,
          [
            meetResult.joinUrl,
            meetResult.eventId,
            meetResult.conferenceStatus,
            meetResult.conferenceId || null,
            appointmentRecord.id,
          ]
        );
        appointmentRecord.location_or_link = meetResult.joinUrl;
        appointmentRecord.calendar_event_id = meetResult.eventId;
        appointmentRecord.conference_status = meetResult.conferenceStatus;
      } catch (meetErr: any) {
        console.error('[Public Booking Google Meet Error]:', meetErr.message);
        resolvedConferenceStatus = 'pending_details';
        await pool.query(
          `UPDATE appointments SET conference_status = 'pending_details', updated_at = NOW() WHERE id = $1`,
          [appointmentRecord.id]
        );
      }
    }

    // 6. Generate RFC 5545 compliant ICS Calendar file with canonical absolute URLs
    const siteUrl = getCanonicalPublicSiteUrl();
    const managementUrl = `${siteUrl}/book/${managementToken}`;
    const icsDescription =
      type === 'google_meet' && finalJoinUrl
        ? `Laurrel Services Consultation\nType: Google Meet Video Consultation\nMeeting Link: ${finalJoinUrl}\nManage Consultation: ${managementUrl}`
        : type === 'google_meet'
        ? `Laurrel Services Consultation\nType: Google Meet Video Consultation\nMeeting Link: Video details are pending coordinator setup\nManage Consultation: ${managementUrl}`
        : `Laurrel Services Consultation\nType: ${type}\nLocation / Details: ${finalJoinUrl || 'Telephone Consultation'}\nManage Consultation: ${managementUrl}`;

    const icsContent = generateIcsInvitation({
      uid: appointmentRecord.id,
      title: appointmentRecord.title,
      description: icsDescription,
      start,
      end,
      location: finalJoinUrl || (type === 'telephone' ? 'Telephone Consultation' : 'Ottawa, ON'),
      attendeeEmail: customerEmail.trim(),
      attendeeName: customerName.trim(),
      status: 'CONFIRMED',
    });

    // 7. Dispatch Customer & Staff Email Notifications (Only mark delivered on actual provider success)
    let emailSuccess = false;
    try {
      const emailProvider = getEmailProvider();
      const sendResult = await emailProvider.sendAppointmentInvitation({
        appointmentId: appointmentRecord.id,
        enquiryId: appointmentRecord.enquiry_id || '',
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        title: appointmentRecord.title,
        purpose: appointmentRecord.purpose,
        appointmentType: type,
        status: 'confirmed',
        scheduledStart: start,
        scheduledEnd: end,
        durationMinutes,
        timezone: 'America/Toronto',
        locationOrLink: finalJoinUrl,
        assignedStaffName: appointmentRecord.assigned_staff_name,
      });

      if (sendResult && sendResult.success) {
        emailSuccess = true;
        await pool.query(
          'UPDATE appointments SET notification_sent = TRUE, notification_sent_at = NOW() WHERE id = $1',
          [appointmentRecord.id]
        );
        if (enquiryId) {
          await pool.query('UPDATE enquiries SET email_delivered = TRUE WHERE id = $1', [enquiryId]);
        }
      }
    } catch (emailErr: any) {
      console.error('[Public Booking Email Dispatch Error]:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      appointment: {
        id: appointmentRecord.id,
        title: appointmentRecord.title,
        scheduledStart: appointmentRecord.scheduled_start,
        scheduledEnd: appointmentRecord.scheduled_end,
        appointmentType: type,
        locationOrLink: finalJoinUrl,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        assignedStaffName: appointmentRecord.assigned_staff_name,
        status: appointmentRecord.status,
        conferenceStatus: resolvedConferenceStatus,
        notificationSent: emailSuccess,
      },
      managementToken,
      managementUrl,
      icsContent,
    });
  }
);

// ============================================================================
// 4. CUSTOMER SELF-SERVICE MANAGEMENT VIEW
// ============================================================================
publicBookingRouter.get(
  '/api/public/appointments/manage/:token',
  publicRateLimit(60, 60000),
  async (req: Request, res: Response): Promise<void> => {
    const pool = getDbPool();
    if (!pool) {
      res.status(500).json({ success: false, error: 'Database unavailable.' });
      return;
    }

    const { token } = req.params;
    if (!token || typeof token !== 'string' || token.length < 20) {
      res.status(400).json({ success: false, error: 'Invalid management token format.' });
      return;
    }

    try {
      const query = `
        SELECT
          id,
          title,
          purpose,
          appointment_type AS "appointmentType",
          status,
          scheduled_start AS "scheduledStart",
          scheduled_end AS "scheduledEnd",
          duration_minutes AS "durationMinutes",
          location_or_link AS "locationOrLink",
          customer_name AS "customerName",
          customer_email AS "customerEmail",
          customer_phone AS "customerPhone",
          service_address AS "serviceAddress",
          customer_timezone AS "customerTimezone",
          assigned_staff_name AS "assignedStaffName",
          cancellation_reason AS "cancellationReason",
          conference_status AS "conferenceStatus"
        FROM appointments
        WHERE management_token = $1
        LIMIT 1
      `;

      const { rows } = await pool.query(query, [token]);
      if (rows.length === 0) {
        res.status(404).json({ success: false, error: 'Consultation appointment not found or expired.' });
        return;
      }

      res.json({ success: true, appointment: rows[0] });
    } catch (err: any) {
      console.error('[Manage Appointment Lookup Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to load appointment details.' });
    }
  }
);

// ============================================================================
// 5. CUSTOMER SELF-SERVICE RESCHEDULE (ENFORCE ALL SCHEDULING RULES)
// ============================================================================
publicBookingRouter.post(
  '/api/public/appointments/reschedule/:token',
  publicRateLimit(10, 600000),
  async (req: Request, res: Response): Promise<void> => {
    const pool = getDbPool();
    if (!pool) {
      res.status(500).json({ success: false, error: 'Database unavailable.' });
      return;
    }

    const { token } = req.params;
    const { newStartUtc } = req.body;

    if (!newStartUtc || isNaN(new Date(newStartUtc).getTime())) {
      res.status(400).json({ success: false, error: 'A valid new appointment start timestamp is required.' });
      return;
    }

    const newStart = new Date(newStartUtc);
    const settings = await getAppointmentSettings();

    const client = await pool.connect();
    let clientReleased = false;

    try {
      await client.query('BEGIN');

      // 1. Fetch current appointment
      const currentRes = await client.query('SELECT * FROM appointments WHERE management_token = $1 FOR UPDATE', [token]);
      if (currentRes.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ success: false, error: 'Appointment not found.' });
        return;
      }

      const currentApt = currentRes.rows[0];

      // Guard against modifying cancelled, completed, or expired appointments
      if (currentApt.status === 'cancelled') {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, error: 'Cancelled consultations cannot be rescheduled.' });
        return;
      }
      if (currentApt.status === 'completed') {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, error: 'Completed consultations cannot be rescheduled.' });
        return;
      }
      if (new Date(currentApt.scheduled_end).getTime() < Date.now()) {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, error: 'Past consultations cannot be rescheduled.' });
        return;
      }

      // Enforce all availability rules for new slot
      const validation = await validateBookingSlot({
        start: newStart,
        appointmentType: currentApt.appointment_type,
        settings,
      });

      if (!validation.valid) {
        await client.query('ROLLBACK');
        res.status(400).json({
          success: false,
          error: validation.error || 'The requested reschedule time does not meet scheduling rules.',
        });
        return;
      }

      const durationMinutes = currentApt.duration_minutes || 30;
      const bufferMinutes = settings.bufferMinutes || 15;
      const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

      // 2. Lock coordinator & verify conflict
      if (currentApt.assigned_staff_id) {
        await client.query('SELECT id FROM admin_users WHERE id = $1 FOR UPDATE', [currentApt.assigned_staff_id]);

        const conflictRes = await client.query(
          `
          SELECT id
          FROM appointments
          WHERE assigned_staff_id = $1
            AND id != $2
            AND status NOT IN ('cancelled')
            AND scheduled_start < $4
            AND scheduled_end > $3
          LIMIT 1
          `,
          [
            currentApt.assigned_staff_id,
            currentApt.id,
            new Date(newStart.getTime() - bufferMinutes * 60000),
            new Date(newEnd.getTime() + bufferMinutes * 60000),
          ]
        );

        if (conflictRes.rows.length > 0) {
          await client.query('ROLLBACK');
          res.status(409).json({ success: false, error: 'The selected new time slot conflicts with coordinator schedule.' });
          return;
        }
      }

      // 3. Update appointment
      await client.query(
        `
        UPDATE appointments
        SET
          scheduled_start = $1,
          scheduled_end = $2,
          status = 'confirmed',
          updated_at = NOW()
        WHERE id = $3
        `,
        [newStart, newEnd, currentApt.id]
      );

      // 4. Log activity
      await client.query(
        `
        INSERT INTO appointment_activity (id, appointment_id, action, performed_by, details)
        VALUES ($1, $2, 'rescheduled', 'Customer (Self-Service)', $3)
        `,
        [
          `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          currentApt.id,
          `Rescheduled from ${currentApt.scheduled_start.toISOString()} to ${newStart.toISOString()}`,
        ]
      );

      await client.query('COMMIT');

      // 5. Update Google Calendar event if exists
      if (currentApt.calendar_event_id) {
        rescheduleGoogleCalendarEvent(currentApt.calendar_event_id, newStart.toISOString(), newEnd.toISOString()).catch(
          (err) => console.warn('[Reschedule Google Sync Warning]:', err.message)
        );
      }

      // 6. Send Customer Reschedule Notification
      try {
        const emailProvider = getEmailProvider();
        await emailProvider.sendAppointmentUpdate(
          {
            appointmentId: currentApt.id,
            enquiryId: currentApt.enquiry_id || '',
            customerName: currentApt.customer_name,
            customerEmail: currentApt.customer_email,
            title: currentApt.title,
            purpose: currentApt.purpose,
            appointmentType: currentApt.appointment_type,
            status: 'confirmed',
            scheduledStart: newStart,
            scheduledEnd: newEnd,
            durationMinutes,
            timezone: 'America/Toronto',
            locationOrLink: currentApt.location_or_link,
            assignedStaffName: currentApt.assigned_staff_name,
          },
          'rescheduled'
        );
      } catch (emailErr: any) {
        console.warn('[Reschedule Notification Warning]:', emailErr.message);
      }

      res.json({
        success: true,
        message: 'Appointment rescheduled successfully.',
        scheduledStart: newStart.toISOString(),
        scheduledEnd: newEnd.toISOString(),
      });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[Public Reschedule Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to reschedule appointment.' });
    } finally {
      if (!clientReleased) {
        clientReleased = true;
        client.release();
      }
    }
  }
);

// ============================================================================
// 6. CUSTOMER SELF-SERVICE CANCELLATION
// ============================================================================
publicBookingRouter.post(
  '/api/public/appointments/cancel/:token',
  publicRateLimit(10, 600000),
  async (req: Request, res: Response): Promise<void> => {
    const pool = getDbPool();
    if (!pool) {
      res.status(500).json({ success: false, error: 'Database unavailable.' });
      return;
    }

    const { token } = req.params;
    const { reason } = req.body;

    try {
      const aptRes = await pool.query('SELECT * FROM appointments WHERE management_token = $1 LIMIT 1', [token]);
      if (aptRes.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Appointment not found.' });
        return;
      }

      const apt = aptRes.rows[0];
      if (apt.status === 'cancelled') {
        res.status(200).json({ success: true, message: 'Appointment is already cancelled.' });
        return;
      }
      if (apt.status === 'completed') {
        res.status(400).json({ success: false, error: 'Completed appointments cannot be cancelled.' });
        return;
      }

      const cancelReason = (reason && typeof reason === 'string' ? reason.trim().slice(0, 500) : 'Cancelled by customer via self-service portal');

      await pool.query(
        `
        UPDATE appointments
        SET
          status = 'cancelled',
          cancellation_reason = $1,
          updated_at = NOW()
        WHERE id = $2
        `,
        [cancelReason, apt.id]
      );

      await pool.query(
        `
        INSERT INTO appointment_activity (id, appointment_id, action, performed_by, details)
        VALUES ($1, $2, 'cancelled', 'Customer (Self-Service)', $3)
        `,
        [`act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, apt.id, cancelReason]
      );

      // Cancel Google Calendar event if exists
      if (apt.calendar_event_id) {
        deleteGoogleCalendarEvent(apt.calendar_event_id).catch((err) =>
          console.warn('[Cancel Google Sync Warning]:', err.message)
        );
      }

      // Send Customer Cancellation Notification
      try {
        const emailProvider = getEmailProvider();
        await emailProvider.sendAppointmentUpdate(
          {
            appointmentId: apt.id,
            enquiryId: apt.enquiry_id || '',
            customerName: apt.customer_name,
            customerEmail: apt.customer_email,
            title: apt.title,
            purpose: apt.purpose,
            appointmentType: apt.appointment_type,
            status: 'cancelled',
            scheduledStart: apt.scheduled_start,
            scheduledEnd: apt.scheduled_end,
            durationMinutes: apt.duration_minutes || 30,
            timezone: 'America/Toronto',
            locationOrLink: apt.location_or_link,
            assignedStaffName: apt.assigned_staff_name,
            cancellationReason: cancelReason,
          },
          'cancelled'
        );
      } catch (emailErr: any) {
        console.warn('[Cancellation Notification Warning]:', emailErr.message);
      }

      res.json({ success: true, message: 'Consultation appointment cancelled successfully.' });
    } catch (err: any) {
      console.error('[Public Cancel Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to cancel appointment.' });
    }
  }
);

// ============================================================================
// 7. DOWNLOAD ICALENDAR (.ICS) FILE (ABSOLUTE CANONICAL URLS)
// ============================================================================
publicBookingRouter.get(
  '/api/public/appointments/:token/ics',
  publicRateLimit(60, 60000),
  async (req: Request, res: Response): Promise<void> => {
    const pool = getDbPool();
    if (!pool) {
      res.status(500).send('Database unavailable');
      return;
    }

    const { token } = req.params;
    try {
      const { rows } = await pool.query('SELECT * FROM appointments WHERE management_token = $1 LIMIT 1', [token]);
      if (rows.length === 0) {
        res.status(404).send('Appointment not found');
        return;
      }

      const apt = rows[0];
      const siteUrl = getCanonicalPublicSiteUrl();
      const managementUrl = `${siteUrl}/book/${apt.management_token}`;

      const icsDescription =
        apt.appointment_type === 'google_meet' && apt.location_or_link
          ? `Laurrel Services Consultation\nType: Google Meet Video Consultation\nMeeting Link: ${apt.location_or_link}\nManage Consultation: ${managementUrl}`
          : apt.appointment_type === 'google_meet'
          ? `Laurrel Services Consultation\nType: Google Meet Video Consultation\nMeeting Link: Video details are pending coordinator setup\nManage Consultation: ${managementUrl}`
          : `Laurrel Services Consultation\nType: ${apt.appointment_type}\nLocation / Details: ${apt.location_or_link || 'Telephone Consultation'}\nManage Consultation: ${managementUrl}`;

      const icsString = generateIcsInvitation({
        uid: apt.id,
        title: apt.title,
        description: icsDescription,
        start: new Date(apt.scheduled_start),
        end: new Date(apt.scheduled_end),
        location: apt.location_or_link || (apt.appointment_type === 'telephone' ? 'Telephone Consultation' : 'Ottawa, ON'),
        attendeeEmail: apt.customer_email,
        attendeeName: apt.customer_name,
        status: apt.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED',
      });

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="laurrel-consultation-${apt.id}.ics"`);
      res.send(icsString);
    } catch (err: any) {
      console.error('[Download ICS Error]:', err);
      res.status(500).send('Failed to generate calendar invitation');
    }
  }
);
