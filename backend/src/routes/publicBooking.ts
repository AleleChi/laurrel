import { Router, Request, Response } from 'express';
import { getDbPool } from '../database/pool';
import { getAppointmentSettings } from '../database/settingsRepo';
import { getProviderIntegration } from '../database/integrationRepo';
import { getAvailableSlots } from '../services/appointments/availabilityEngine';
import { generateManagementToken } from '../services/security/crypto';
import { createGoogleMeetEvent, deleteGoogleCalendarEvent, rescheduleGoogleCalendarEvent } from '../services/video/googleCalendarClient';
import { generateIcsInvitation } from '../services/appointments/icsGenerator';
import { getEmailProvider } from '../services/email';

export const publicBookingRouter = Router();

// ============================================================================
// 1. PUBLIC CONFIGURATION
// ============================================================================
publicBookingRouter.get('/api/public/appointments/config', async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getAppointmentSettings();
    const googleIntegration = await getProviderIntegration('google_meet');

    const isGoogleMeetActive =
      googleIntegration?.status === 'connected' &&
      Boolean(googleIntegration.credentials?.refreshToken);

    // Only expose public safe settings
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
});

// ============================================================================
// 2. PUBLIC AVAILABILITY
// ============================================================================
publicBookingRouter.get('/api/public/appointments/availability', async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, type, timezone } = req.query;

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ success: false, error: 'A valid date parameter in YYYY-MM-DD format is required.' });
      return;
    }

    const appointmentType = typeof type === 'string' ? type.trim().toLowerCase() : 'telephone';
    const customerTimezone = typeof timezone === 'string' && timezone.trim() ? timezone.trim() : 'America/Toronto';

    const result = await getAvailableSlots(date, appointmentType, customerTimezone);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[Public Availability Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve available appointment times.' });
  }
});

// ============================================================================
// 3. BOOK APPOINTMENT (ATOMIC RESERVATION + OPTIONAL PROVIDER CREATION)
// ============================================================================
publicBookingRouter.post('/api/public/appointments/book', async (req: Request, res: Response): Promise<void> => {
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

  // Validation
  if (!customerName || !customerName.trim()) {
    res.status(400).json({ success: false, error: 'Customer name is required.' });
    return;
  }
  if (!customerEmail || !customerEmail.includes('@')) {
    res.status(400).json({ success: false, error: 'A valid email address is required.' });
    return;
  }
  if (!startUtc || isNaN(new Date(startUtc).getTime())) {
    res.status(400).json({ success: false, error: 'A valid appointment start timestamp is required.' });
    return;
  }

  const type = (appointmentType || 'telephone').trim().toLowerCase();
  const settings = await getAppointmentSettings();

  // Channel check
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

  const durationMinutes = settings.slotDurationMinutes || 30;
  const bufferMinutes = settings.bufferMinutes || 15;
  const start = new Date(startUtc);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  // Minimum notice check
  const minNoticeCutoff = new Date(Date.now() + (settings.minNoticeHours || 2) * 3600000);
  if (start < minNoticeCutoff) {
    res.status(400).json({
      success: false,
      error: `Consultations must be scheduled at least ${settings.minNoticeHours || 2} hours in advance.`,
    });
    return;
  }

  const client = await pool.connect();
  let appointmentRecord: any = null;
  const managementToken = generateManagementToken();
  const resolvedIdempKey = idempotencyKey || `idemp_pub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    await client.query('BEGIN');

    // 1. Check idempotency replay
    if (idempotencyKey) {
      const existingRes = await client.query(
        'SELECT * FROM appointments WHERE idempotency_key = $1 LIMIT 1',
        [idempotencyKey]
      );
      if (existingRes.rows.length > 0) {
        await client.query('COMMIT');
        client.release();
        res.status(200).json({
          success: true,
          replayed: true,
          appointment: existingRes.rows[0],
          managementToken: existingRes.rows[0].management_token,
        });
        return;
      }
    }

    // 2. Select eligible staff coordinator and lock
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

      // Check conflict in Neon DB with buffer
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
      client.release();
      res.status(409).json({
        success: false,
        error: 'The requested time slot has just been reserved. Please select another available time.',
      });
      return;
    }

    // 3. Create linked customer enquiry in Neon lead pipeline
    const enquiryId = `ENQ-BOOK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const serviceLabel = (serviceType || 'general').trim();
    const enquiryDetails = `Customer self-service consultation booked via Website Booking Portal.\nService: ${serviceLabel}\nFormat: ${type}\nNotes: ${customerNotes || 'None'}`;

    await client.query(
      `
      INSERT INTO enquiries (
        id, intent, source, customer_name, customer_email, customer_phone,
        services, service_location, details, status, email_delivered
      )
      VALUES ($1, 'scheduled_consultation', 'web_booking_portal', $2, $3, $4, $5, $6, $7, 'scheduled', TRUE)
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

    const insertAptQuery = `
      INSERT INTO appointments (
        id, enquiry_id, title, purpose, appointment_type, status,
        scheduled_start, scheduled_end, duration_minutes, timezone,
        customer_name, customer_email, customer_phone, location_or_link,
        assigned_staff_id, assigned_staff_name, staff_notes, notification_sent,
        idempotency_key, created_by, management_token, service_address,
        booking_source, customer_timezone, customer_notes
      )
      VALUES (
        $1, $2, $3, $4, $5, 'confirmed',
        $6, $7, $8, 'America/Toronto',
        $9, $10, $11, $12,
        $13, $14, $15, FALSE,
        $16, $13, $17, $18,
        'public_self_service', $19, $20
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
      customerTimezone || 'America/Toronto',
      customerNotes?.trim() || null,
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
        JSON.stringify({ channel: type, customerTimezone, enquiryId }),
      ]
    );

    await client.query('COMMIT');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[Public Booking Transaction Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to complete appointment booking. Please try again.' });
    return;
  } finally {
    client.release();
  }

  // 5. Asynchronous External Provider Integration (Google Meet) without holding DB locks
  let finalJoinUrl = appointmentRecord.location_or_link;
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

      // Update Neon record with real Google Meet joining link & event ID
      await pool.query(
        `
        UPDATE appointments
        SET
          location_or_link = $1,
          calendar_event_id = $2,
          updated_at = NOW()
        WHERE id = $3
        `,
        [meetResult.joinUrl, meetResult.eventId, appointmentRecord.id]
      );
      appointmentRecord.location_or_link = meetResult.joinUrl;
      appointmentRecord.calendar_event_id = meetResult.eventId;
    } catch (meetErr: any) {
      console.error('[Public Booking Google Meet Error]:', meetErr.message);
      // Non-blocking: appointment remains recorded, notification notes coordination
    }
  }

  // 6. Generate ICS Calendar file
  const icsContent = generateIcsInvitation({
    uid: appointmentRecord.id,
    title: appointmentRecord.title,
    description: `Laurrel Services Consultation\nType: ${type}\nDetails: ${finalJoinUrl || 'Coordinator will initiate call'}\nSelf-service manage link: /book/${managementToken}`,
    start,
    end,
    location: finalJoinUrl || 'Telephone Consultation',
    attendeeEmail: customerEmail.trim(),
    attendeeName: customerName.trim(),
  });

  // 7. Dispatch Customer & Staff Email Notifications
  try {
    const emailProvider = getEmailProvider();
    await emailProvider.sendAppointmentInvitation({
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

    await pool.query('UPDATE appointments SET notification_sent = TRUE, notification_sent_at = NOW() WHERE id = $1', [
      appointmentRecord.id,
    ]);
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
    },
    managementToken,
    icsContent,
  });
});

// ============================================================================
// 4. CUSTOMER SELF-SERVICE MANAGEMENT VIEW
// ============================================================================
publicBookingRouter.get('/api/public/appointments/manage/:token', async (req: Request, res: Response): Promise<void> => {
  const pool = getDbPool();
  if (!pool) {
    res.status(500).json({ success: false, error: 'Database unavailable.' });
    return;
  }

  const { token } = req.params;
  if (!token || token.length < 10) {
    res.status(400).json({ success: false, error: 'Invalid management token.' });
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
        cancellation_reason AS "cancellationReason"
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
});

// ============================================================================
// 5. CUSTOMER SELF-SERVICE RESCHEDULE
// ============================================================================
publicBookingRouter.post('/api/public/appointments/reschedule/:token', async (req: Request, res: Response): Promise<void> => {
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
  const minNoticeCutoff = new Date(Date.now() + (settings.minNoticeHours || 2) * 3600000);

  if (newStart < minNoticeCutoff) {
    res.status(400).json({
      success: false,
      error: `Appointments must be rescheduled at least ${settings.minNoticeHours || 2} hours in advance.`,
    });
    return;
  }

  const client = await pool.connect();
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
    if (currentApt.status === 'cancelled') {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, error: 'Cancelled appointments cannot be rescheduled.' });
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
    client.release();
  }
});

// ============================================================================
// 6. CUSTOMER SELF-SERVICE CANCELLATION
// ============================================================================
publicBookingRouter.post('/api/public/appointments/cancel/:token', async (req: Request, res: Response): Promise<void> => {
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

    const cancelReason = (reason || 'Cancelled by customer via self-service portal').trim();

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
});

// ============================================================================
// 7. DOWNLOAD ICALENDAR (.ICS) FILE
// ============================================================================
publicBookingRouter.get('/api/public/appointments/:token/ics', async (req: Request, res: Response): Promise<void> => {
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
    const icsString = generateIcsInvitation({
      uid: apt.id,
      title: apt.title,
      description: `Laurrel Services Consultation\nType: ${apt.appointment_type}\nJoin / Location: ${apt.location_or_link || 'Telephone Consultation'}\nManage: /book/${apt.management_token}`,
      start: new Date(apt.scheduled_start),
      end: new Date(apt.scheduled_end),
      location: apt.location_or_link || 'Telephone Consultation',
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
});
