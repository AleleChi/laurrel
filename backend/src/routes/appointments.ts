import { Router, Request, Response } from 'express';
import { requireAdminAuth, requireRole } from '../middleware/auth';
import {
  createAppointment,
  getAppointmentById,
  getAppointments,
  getAppointmentsByEnquiryId,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
  checkStaffConflict,
  recordAppointmentNotification,
  getAppointmentActivity,
  AppointmentStatus,
} from '../database/appointmentRepo';
import { getVideoMeetingProvider, AppointmentType } from '../services/video';
import { getEmailProvider } from '../services/email';

export const appointmentsRouter = Router();

// Enforce admin authentication across all appointment operations
appointmentsRouter.use('/api/admin/appointments', requireAdminAuth);

const VALID_APPOINTMENT_TYPES: AppointmentType[] = [
  'telephone',
  'in_person',
  'on_site',
  'google_meet',
  'ms_teams',
  'zoom',
];

const VALID_STATUSES: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'rescheduled',
  'cancelled',
  'no_show',
];

/**
 * GET /api/admin/appointments - List appointments with filters
 */
appointmentsRouter.get(
  '/api/admin/appointments',
  requireRole(['owner', 'admin', 'operations_staff', 'viewer', 'content_editor']),
  async (req: Request, res: Response) => {
    try {
      const { enquiryId, status, staffId, startDate, endDate, limit } = req.query;

      const appointments = await getAppointments({
        enquiryId: typeof enquiryId === 'string' ? enquiryId : undefined,
        status: typeof status === 'string' ? status : undefined,
        assignedStaffId: typeof staffId === 'string' ? staffId : undefined,
        startDate: typeof startDate === 'string' ? startDate : undefined,
        endDate: typeof endDate === 'string' ? endDate : undefined,
        limit: limit ? parseInt(limit as string, 10) : 200,
      });

      res.status(200).json({ appointments });
    } catch (err: any) {
      console.error('[Appointments GET Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/admin/appointments/enquiry/:enquiryId - Appointments for specific enquiry
 */
appointmentsRouter.get(
  '/api/admin/appointments/enquiry/:enquiryId',
  requireRole(['owner', 'admin', 'operations_staff', 'viewer', 'content_editor']),
  async (req: Request, res: Response) => {
    try {
      const enquiryId = Array.isArray(req.params.enquiryId) ? req.params.enquiryId[0] : req.params.enquiryId;
      const appointments = await getAppointmentsByEnquiryId(enquiryId);
      res.status(200).json({ appointments });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/admin/appointments/staff/conflicts - Check staff booking conflicts
 */
appointmentsRouter.get(
  '/api/admin/appointments/staff/conflicts',
  requireRole(['owner', 'admin', 'operations_staff', 'viewer', 'content_editor']),
  async (req: Request, res: Response) => {
    try {
      const { staffId, start, end, excludeId } = req.query;

      if (!staffId || !start || !end) {
        res.status(400).json({ error: 'staffId, start, and end parameters are required.' });
        return;
      }

      const conflict = await checkStaffConflict(
        String(staffId),
        String(start),
        String(end),
        typeof excludeId === 'string' ? excludeId : undefined
      );

      res.status(200).json({
        hasConflict: Boolean(conflict),
        conflictingAppointment: conflict,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/admin/appointments - Book consultation with idempotency protection
 */
appointmentsRouter.post(
  '/api/admin/appointments',
  requireRole(['owner', 'admin', 'operations_staff']),
  async (req: Request, res: Response) => {
    try {
      const {
        enquiryId,
        title,
        purpose,
        appointmentType,
        status = 'pending',
        scheduledStart,
        durationMinutes = 30,
        customerName,
        customerEmail,
        customerPhone,
        locationOrLink,
        assignedStaffId,
        assignedStaffName,
        staffNotes,
        notifyCustomer = true,
      } = req.body;

      // Extract idempotency key from header or body
      const idempotencyKey =
        (req.headers['idempotency-key'] as string) ||
        (req.headers['x-idempotency-key'] as string) ||
        req.body.idempotencyKey;

      // Validation
      if (!enquiryId || !title || !scheduledStart || !customerName || !customerEmail) {
        res.status(400).json({
          error: 'enquiryId, title, scheduledStart, customerName, and customerEmail are required.',
        });
        return;
      }

      const type: AppointmentType = VALID_APPOINTMENT_TYPES.includes(appointmentType)
        ? appointmentType
        : 'telephone';

      const initialStatus: AppointmentStatus = VALID_STATUSES.includes(status)
        ? status
        : 'pending';

      const startDate = new Date(scheduledStart);
      if (isNaN(startDate.getTime())) {
        res.status(400).json({ error: 'Invalid scheduledStart timestamp.' });
        return;
      }

      const duration = Number(durationMinutes) > 0 ? Number(durationMinutes) : 30;
      const endDate = new Date(startDate.getTime() + duration * 60000);

      // Process meeting details through video/manual provider
      const videoProvider = getVideoMeetingProvider(type);
      const meetingResult = await videoProvider.createMeeting({
        title,
        purpose,
        appointmentType: type,
        startTime: startDate,
        endTime: endDate,
        durationMinutes: duration,
        customerName,
        customerEmail,
        customerPhone,
        staffName: assignedStaffName,
        locationOrLink,
      });

      // Resolved location or join link
      const resolvedLocationOrLink = meetingResult.joinUrl || meetingResult.location || locationOrLink || null;

      const performedBy = req.adminUser?.name || req.adminUser?.email || 'Operations Staff';

      const { appointment, isNew } = await createAppointment(
        {
          enquiryId,
          title,
          purpose,
          appointmentType: type,
          status: initialStatus,
          scheduledStart: startDate,
          scheduledEnd: endDate,
          durationMinutes: duration,
          timezone: 'America/Toronto',
          customerName,
          customerEmail,
          customerPhone,
          locationOrLink: resolvedLocationOrLink,
          assignedStaffId,
          assignedStaffName,
          staffNotes,
          idempotencyKey,
          createdBy: req.adminUser?.id,
        },
        performedBy
      );

      // Safe Idempotent Replay: If appointment already existed with this idempotency key, return it without duplicate notifications
      if (!isNew) {
        res.status(200).json({
          appointment,
          meetingDetails: meetingResult,
          emailDispatch: { attempted: false, success: true, replay: true },
          idempotentReplay: true,
        });
        return;
      }

      // Handle customer notification if requested
      let emailDispatch = { attempted: false, success: false, error: undefined as string | undefined };
      if (notifyCustomer) {
        emailDispatch.attempted = true;
        const emailProvider = getEmailProvider();

        if (emailProvider.isConfigured()) {
          const dispatchRes = await emailProvider.sendAppointmentInvitation({
            appointmentId: appointment.id,
            enquiryId: appointment.enquiryId,
            customerName: appointment.customerName,
            customerEmail: appointment.customerEmail,
            title: appointment.title,
            purpose: appointment.purpose,
            appointmentType: appointment.appointmentType,
            status: appointment.status,
            scheduledStart: appointment.scheduledStart,
            scheduledEnd: appointment.scheduledEnd,
            durationMinutes: appointment.durationMinutes,
            timezone: appointment.timezone,
            locationOrLink: appointment.locationOrLink,
            assignedStaffName: appointment.assignedStaffName,
          });

          emailDispatch.success = dispatchRes.success;
          emailDispatch.error = dispatchRes.error;

          await recordAppointmentNotification(
            appointment.id,
            appointment.customerEmail,
            'invitation',
            dispatchRes.success ? 'sent' : 'failed',
            dispatchRes.error
          );
        } else {
          emailDispatch.error = 'Transactional email service is not configured.';
          await recordAppointmentNotification(
            appointment.id,
            appointment.customerEmail,
            'invitation',
            'failed',
            'Email service unconfigured'
          );
        }
      }

      res.status(201).json({
        appointment,
        meetingDetails: meetingResult,
        emailDispatch,
      });
    } catch (err: any) {
      if (err.code === 'STAFF_CONFLICT') {
        res.status(409).json({
          error: err.message,
          code: 'STAFF_CONFLICT',
          conflict: err.conflict,
        });
        return;
      }
      console.error('[Appointment Creation Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/admin/appointments/:id - Get appointment details & activity timeline
 */
appointmentsRouter.get(
  '/api/admin/appointments/:id',
  requireRole(['owner', 'admin', 'operations_staff', 'viewer', 'content_editor']),
  async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const appointment = await getAppointmentById(id);

      if (!appointment) {
        res.status(404).json({ error: 'Appointment not found.' });
        return;
      }

      const activity = await getAppointmentActivity(id);
      res.status(200).json({ appointment, activity });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * PATCH /api/admin/appointments/:id/status - Update appointment status
 */
appointmentsRouter.patch(
  '/api/admin/appointments/:id/status',
  requireRole(['owner', 'admin', 'operations_staff']),
  async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, reason, notifyCustomer = true } = req.body;

      if (!VALID_STATUSES.includes(status)) {
        res.status(400).json({
          error: `Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`,
        });
        return;
      }

      const existing = await getAppointmentById(id);
      if (!existing) {
        res.status(404).json({ error: 'Appointment not found.' });
        return;
      }

      const performedBy = req.adminUser?.name || req.adminUser?.email || 'Operations Staff';
      const updated = await updateAppointmentStatus(id, status, performedBy, reason);

      let emailDispatch = { attempted: false, success: false, error: undefined as string | undefined };
      // When confirming a previously unconfirmed/pending appointment, dispatch confirmed customer email
      if (status === 'confirmed' && existing.status !== 'confirmed' && notifyCustomer) {
        emailDispatch.attempted = true;
        const emailProvider = getEmailProvider();
        if (emailProvider.isConfigured()) {
          const dispatchRes = await emailProvider.sendAppointmentInvitation({
            appointmentId: updated.id,
            enquiryId: updated.enquiryId,
            customerName: updated.customerName,
            customerEmail: updated.customerEmail,
            title: updated.title,
            purpose: updated.purpose,
            appointmentType: updated.appointmentType,
            status: 'confirmed',
            scheduledStart: updated.scheduledStart,
            scheduledEnd: updated.scheduledEnd,
            durationMinutes: updated.durationMinutes,
            timezone: updated.timezone,
            locationOrLink: updated.locationOrLink,
            assignedStaffName: updated.assignedStaffName,
          });

          emailDispatch.success = dispatchRes.success;
          emailDispatch.error = dispatchRes.error;

          await recordAppointmentNotification(
            updated.id,
            updated.customerEmail,
            'confirmation',
            dispatchRes.success ? 'sent' : 'failed',
            dispatchRes.error
          );
        }
      }

      res.status(200).json({ appointment: updated, emailDispatch });
    } catch (err: any) {
      if (err.code === 'STAFF_CONFLICT') {
        res.status(409).json({
          error: err.message,
          code: 'STAFF_CONFLICT',
          conflict: err.conflict,
        });
        return;
      }
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/admin/appointments/:id/reschedule - Reschedule consultation to new time
 */
appointmentsRouter.post(
  '/api/admin/appointments/:id/reschedule',
  requireRole(['owner', 'admin', 'operations_staff']),
  async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { scheduledStart, durationMinutes, reason, notifyCustomer = true } = req.body;

      if (!scheduledStart) {
        res.status(400).json({ error: 'scheduledStart timestamp is required.' });
        return;
      }

      const startDate = new Date(scheduledStart);
      if (isNaN(startDate.getTime())) {
        res.status(400).json({ error: 'Invalid scheduledStart timestamp.' });
        return;
      }

      const existing = await getAppointmentById(id);
      if (!existing) {
        res.status(404).json({ error: 'Appointment not found.' });
        return;
      }

      const duration = Number(durationMinutes) > 0 ? Number(durationMinutes) : existing.durationMinutes;
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const performedBy = req.adminUser?.name || req.adminUser?.email || 'Operations Staff';

      const updated = await rescheduleAppointment(
        id,
        startDate,
        endDate,
        duration,
        reason || 'Rescheduled by staff coordinator',
        performedBy
      );

      let emailDispatch = { attempted: false, success: false, error: undefined as string | undefined };
      if (notifyCustomer) {
        emailDispatch.attempted = true;
        const emailProvider = getEmailProvider();
        if (emailProvider.isConfigured()) {
          const dispatchRes = await emailProvider.sendAppointmentUpdate(
            {
              appointmentId: updated.id,
              enquiryId: updated.enquiryId,
              customerName: updated.customerName,
              customerEmail: updated.customerEmail,
              title: updated.title,
              appointmentType: updated.appointmentType,
              scheduledStart: updated.scheduledStart,
              scheduledEnd: updated.scheduledEnd,
              durationMinutes: updated.durationMinutes,
              timezone: updated.timezone,
              cancellationReason: reason,
            },
            'rescheduled'
          );
          emailDispatch.success = dispatchRes.success;
          emailDispatch.error = dispatchRes.error;

          await recordAppointmentNotification(
            updated.id,
            updated.customerEmail,
            'rescheduled',
            dispatchRes.success ? 'sent' : 'failed',
            dispatchRes.error
          );
        }
      }

      res.status(200).json({ appointment: updated, emailDispatch });
    } catch (err: any) {
      if (err.code === 'STAFF_CONFLICT') {
        res.status(409).json({
          error: err.message,
          code: 'STAFF_CONFLICT',
          conflict: err.conflict,
        });
        return;
      }
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/admin/appointments/:id/cancel - Cancel appointment
 */
appointmentsRouter.post(
  '/api/admin/appointments/:id/cancel',
  requireRole(['owner', 'admin', 'operations_staff']),
  async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { reason, notifyCustomer = true } = req.body;

      if (!reason || !reason.trim()) {
        res.status(400).json({ error: 'A cancellation reason is required.' });
        return;
      }

      const performedBy = req.adminUser?.name || req.adminUser?.email || 'Operations Staff';
      const cancelled = await cancelAppointment(id, reason.trim(), performedBy);

      let emailDispatch = { attempted: false, success: false, error: undefined as string | undefined };
      if (notifyCustomer) {
        emailDispatch.attempted = true;
        const emailProvider = getEmailProvider();
        if (emailProvider.isConfigured()) {
          const dispatchRes = await emailProvider.sendAppointmentUpdate(
            {
              appointmentId: cancelled.id,
              enquiryId: cancelled.enquiryId,
              customerName: cancelled.customerName,
              customerEmail: cancelled.customerEmail,
              title: cancelled.title,
              appointmentType: cancelled.appointmentType,
              scheduledStart: cancelled.scheduledStart,
              scheduledEnd: cancelled.scheduledEnd,
              durationMinutes: cancelled.durationMinutes,
              timezone: cancelled.timezone,
              cancellationReason: reason,
            },
            'cancelled'
          );
          emailDispatch.success = dispatchRes.success;
          emailDispatch.error = dispatchRes.error;

          await recordAppointmentNotification(
            cancelled.id,
            cancelled.customerEmail,
            'cancellation',
            dispatchRes.success ? 'sent' : 'failed',
            dispatchRes.error
          );
        }
      }

      res.status(200).json({ appointment: cancelled, emailDispatch });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/admin/appointments/:id/resend-invite - Resend invitation email
 */
appointmentsRouter.post(
  '/api/admin/appointments/:id/resend-invite',
  requireRole(['owner', 'admin', 'operations_staff']),
  async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const appointment = await getAppointmentById(id);

      if (!appointment) {
        res.status(404).json({ error: 'Appointment not found.' });
        return;
      }

      const emailProvider = getEmailProvider();
      if (!emailProvider.isConfigured()) {
        res.status(503).json({
          error: 'Transactional email service is not configured.',
          provider: 'none',
        });
        return;
      }

      const dispatchRes = await emailProvider.sendAppointmentInvitation({
        appointmentId: appointment.id,
        enquiryId: appointment.enquiryId,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        title: appointment.title,
        purpose: appointment.purpose,
        appointmentType: appointment.appointmentType,
        scheduledStart: appointment.scheduledStart,
        scheduledEnd: appointment.scheduledEnd,
        durationMinutes: appointment.durationMinutes,
        timezone: appointment.timezone,
        locationOrLink: appointment.locationOrLink,
        assignedStaffName: appointment.assignedStaffName,
      });

      await recordAppointmentNotification(
        appointment.id,
        appointment.customerEmail,
        'invitation',
        dispatchRes.success ? 'sent' : 'failed',
        dispatchRes.error
      );

      res.status(200).json({
        success: dispatchRes.success,
        messageId: dispatchRes.messageId,
        error: dispatchRes.error,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);
