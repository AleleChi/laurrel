'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Phone,
  MapPin,
  Video,
  User,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import {
  AppointmentType,
  APPOINTMENT_TYPE_LABELS,
  formatOttawaDateTime,
  ottawaToUtcDate,
  ottawaToUtcIso,
  utcToOttawaDate,
  utcToOttawaTime,
} from '@/lib/utils/formatters';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled?: (appointment: any) => void;
  onSuccess?: (appointment: any) => void;
  enquiry?: {
    id: string;
    customer: {
      name: string;
      email: string;
      phone?: string;
    };
    services?: string[];
    serviceLocation?: string;
    preferredTiming?: string;
    details?: string;
  };
  enquiryId?: string;
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };
  rescheduleAppointmentId?: string | null;
  initialAppointment?: any | null;
}

export default function ScheduleMeetingModal({
  isOpen,
  onClose,
  onScheduled,
  onSuccess,
  enquiry,
  enquiryId,
  customer,
  rescheduleAppointmentId,
  initialAppointment,
}: ScheduleMeetingModalProps) {
  const isReschedule = Boolean(rescheduleAppointmentId);

  // Normalize enquiry and customer data from flexible props
  const resolvedEnquiryId = enquiry?.id || enquiryId || '';
  const resolvedCustomer = enquiry?.customer || customer || { name: 'Customer', email: '' };
  const resolvedServices = enquiry?.services || [];
  const resolvedLocation = enquiry?.serviceLocation || '';

  const notifySuccess = (apt: any) => {
    if (onScheduled) onScheduled(apt);
    if (onSuccess) onSuccess(apt);
  };

  // Form states
  const defaultServicesTitle =
    resolvedServices.length > 0
      ? `${resolvedServices.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' & ')} Consultation`
      : 'Customer Consultation';

  const [title, setTitle] = useState(
    initialAppointment?.title || `${defaultServicesTitle} — ${resolvedCustomer.name}`
  );
  const [purpose, setPurpose] = useState(
    initialAppointment?.purpose || 'Review service scope, schedule, and estimate requirements'
  );
  const [appointmentType, setAppointmentType] = useState<AppointmentType>(
    initialAppointment?.appointmentType || 'telephone'
  );

  // Date and Time (default to tomorrow at 10:00 AM Ottawa time)
  const tomorrowOttawa = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return utcToOttawaDate(d);
  })();

  const [dateStr, setDateStr] = useState(
    initialAppointment?.scheduledStart
      ? utcToOttawaDate(initialAppointment.scheduledStart)
      : tomorrowOttawa
  );
  const [timeStr, setTimeStr] = useState(
    initialAppointment?.scheduledStart
      ? utcToOttawaTime(initialAppointment.scheduledStart)
      : '10:00'
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    initialAppointment?.durationMinutes || 30
  );
  const [initialStatus, setInitialStatus] = useState<'confirmed' | 'pending'>(
    initialAppointment?.status === 'pending' ? 'pending' : 'confirmed'
  );

  // Staff and Location
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    initialAppointment?.assignedStaffId || ''
  );
  const [locationOrLink, setLocationOrLink] = useState<string>(
    initialAppointment?.locationOrLink || ''
  );
  const [staffNotes, setStaffNotes] = useState<string>(
    initialAppointment?.staffNotes || ''
  );
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [notifyCustomer, setNotifyCustomer] = useState<boolean>(true);

  // Stable idempotency key for this logical booking attempt across retries
  const [bookingIdempotencyKey, setBookingIdempotencyKey] = useState<string>(() =>
    `idemp_${resolvedEnquiryId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  );

  useEffect(() => {
    if (isOpen && !isReschedule) {
      setBookingIdempotencyKey(`idemp_${resolvedEnquiryId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
    }
  }, [isOpen, resolvedEnquiryId, isReschedule]);

  // Conflict & submission states
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load available staff members
  useEffect(() => {
    if (!isOpen) return;

    setLoadingStaff(true);
    fetch('/api/admin/staff')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.staff && Array.isArray(data.staff)) {
          setStaffList(data.staff);
          if (!selectedStaffId && data.staff.length > 0) {
            setSelectedStaffId(data.staff[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load staff list:', err))
      .finally(() => setLoadingStaff(false));
  }, [isOpen]);

  // Adjust default location / link based on type selection
  useEffect(() => {
    if (initialAppointment && !isReschedule) return;

    if (appointmentType === 'telephone') {
      setLocationOrLink(resolvedCustomer.phone || 'Customer telephone number');
    } else if (appointmentType === 'on_site') {
      setLocationOrLink(resolvedLocation || 'Customer service address (Ottawa)');
    } else if (appointmentType === 'in_person') {
      setLocationOrLink('Laurrel Services Office (Ottawa, ON)');
    } else {
      setLocationOrLink('');
    }
  }, [appointmentType, resolvedCustomer.phone, resolvedLocation]);

  // Check schedule conflicts when staff or time changes
  useEffect(() => {
    if (!selectedStaffId || !dateStr || !timeStr) return;

    try {
      const startIso = ottawaToUtcIso(dateStr, timeStr);
      const startUtcDate = ottawaToUtcDate(dateStr, timeStr);
      const endIso = new Date(startUtcDate.getTime() + durationMinutes * 60000).toISOString();

      const query = new URLSearchParams({
        staffId: selectedStaffId,
        start: startIso,
        end: endIso,
      });
      if (rescheduleAppointmentId) {
        query.set('excludeId', rescheduleAppointmentId);
      }

      fetch(`/api/admin/appointments/staff/conflicts?${query.toString()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.hasConflict && data.conflictingAppointment) {
            setConflictWarning(
              `Notice: Staff member already has an appointment booked ("${data.conflictingAppointment.title}").`
            );
          } else {
            setConflictWarning(null);
          }
        })
        .catch(() => setConflictWarning(null));
    } catch {
      setConflictWarning(null);
    }
  }, [selectedStaffId, dateStr, timeStr, durationMinutes, rescheduleAppointmentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (!title.trim()) throw new Error('Meeting title is required.');
      if (!dateStr || !timeStr) throw new Error('Valid date and time are required.');

      const scheduledStart = ottawaToUtcIso(dateStr, timeStr);
      const assignedStaff = staffList.find((s) => s.id === selectedStaffId);

      if (conflictWarning) {
        throw new Error(
          'Please resolve the coordinator scheduling conflict before saving the appointment.'
        );
      }

      if (isReschedule && rescheduleAppointmentId) {
        const res = await fetch(`/api/admin/appointments/${rescheduleAppointmentId}/reschedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledStart,
            durationMinutes,
            reason: rescheduleReason || 'Customer requested schedule change',
            notifyCustomer,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to reschedule appointment.');

        notifySuccess(data.appointment);
        onClose();
      } else {
        const idempotencyKey = bookingIdempotencyKey;

        const res = await fetch('/api/admin/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            enquiryId: resolvedEnquiryId,
            title: title.trim(),
            purpose: purpose.trim(),
            appointmentType,
            scheduledStart,
            durationMinutes,
            customerName: resolvedCustomer.name,
            customerEmail: resolvedCustomer.email,
            customerPhone: resolvedCustomer.phone,
            locationOrLink: locationOrLink.trim(),
            assignedStaffId: selectedStaffId || undefined,
            assignedStaffName: assignedStaff?.name || undefined,
            staffNotes: staffNotes.trim(),
            status: initialStatus,
            notifyCustomer,
            idempotencyKey,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to schedule consultation.');

        notifySuccess(data.appointment);
        onClose();
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred while booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-md shadow-xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/70">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 tracking-tight">
              {isReschedule ? 'Reschedule Consultation' : 'Schedule Customer Consultation'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Customer: {resolvedCustomer.name} • Ref: <span className="font-mono text-zinc-600">{resolvedEnquiryId}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {formError && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Meeting Title & Purpose */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Meeting Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#390044] transition-all"
                placeholder="e.g. Residential Move Consultation"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Consultation Scope / Purpose
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#390044] transition-all"
                placeholder="Brief purpose of the consultation"
              />
            </div>
          </div>

          {/* Format Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Consultation Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  { type: 'telephone', label: 'Telephone', icon: Phone },
                  { type: 'in_person', label: 'In-Person', icon: User },
                  { type: 'on_site', label: 'On-Site Assessment', icon: MapPin },
                  { type: 'google_meet', label: 'Google Meet', icon: Video },
                  { type: 'ms_teams', label: 'Teams (In Dev)', icon: Video },
                  { type: 'zoom', label: 'Zoom (In Dev)', icon: Video },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const isSelected = appointmentType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setAppointmentType(item.type)}
                    className={`flex items-center gap-2 p-2.5 rounded-md border text-xs font-medium text-left transition-all ${
                      isSelected
                        ? 'border-[#390044] bg-[#390044]/10 text-[#390044] font-semibold'
                        : 'border-zinc-200/80 hover:border-zinc-300 text-zinc-700 bg-white'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#390044]' : 'text-zinc-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Video provider credentials notice */}
            {(appointmentType === 'google_meet' ||
              appointmentType === 'ms_teams' ||
              appointmentType === 'zoom') && (
              <p className="text-[11px] text-zinc-500 mt-2 bg-zinc-50 p-2.5 rounded-md border border-zinc-200/70">
                <strong>Meeting Link Notice:</strong> Automated video links require external OAuth connection. Enter meeting URL below or arrange manually.
              </p>
            )}
          </div>

          {/* Initial Status Selector (if not rescheduling) */}
          {!isReschedule && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Consultation Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInitialStatus('confirmed')}
                  className={`p-2.5 rounded-md border text-xs text-left transition-all ${
                    initialStatus === 'confirmed'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-medium'
                      : 'border-zinc-200/80 text-zinc-700 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="font-semibold text-emerald-800">Confirmed</div>
                  <div className="text-[11px] text-emerald-700/80">Sends confirmed booking notice to customer</div>
                </button>
                <button
                  type="button"
                  onClick={() => setInitialStatus('pending')}
                  className={`p-2.5 rounded-md border text-xs text-left transition-all ${
                    initialStatus === 'pending'
                      ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-medium'
                      : 'border-zinc-200/80 text-zinc-700 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="font-semibold text-amber-800">Pending Review</div>
                  <div className="text-[11px] text-amber-700/80">Awaiting coordinator confirmation</div>
                </button>
              </div>
            </div>
          )}

          {/* Date, Time, Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#390044]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Start Time (Ottawa) <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#390044]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Duration (Minutes)
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-md bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#390044]"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Timezone strictly enforced as <strong>America/Toronto (Ottawa Local Time)</strong>.</span>
          </div>

          {/* Assigned Staff Coordinator */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Assigned Coordinator <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#390044]"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>

          {conflictWarning && (
            <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{conflictWarning}</span>
            </div>
          )}

          {/* Location or Meeting URL */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Location or Meeting URL
            </label>
            <input
              type="text"
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              placeholder="e.g. https://meet.google.com/xxx-xxxx-xxx or Customer Address"
              className="w-full px-3 py-2 rounded-md bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#390044]"
            />
          </div>

          {/* Reschedule Reason (if rescheduling) */}
          {isReschedule && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Reason for Rescheduling
              </label>
              <input
                type="text"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g. Customer requested afternoon time instead"
                className="w-full px-3 py-2 rounded-md bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#390044]"
              />
            </div>
          )}

          {/* Internal Staff Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Internal Preparation Notes
            </label>
            <textarea
              rows={2}
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              placeholder="Private notes for coordinator and crew..."
              className="w-full px-3 py-2 rounded-md bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#390044]"
            />
          </div>

          {/* Notify Customer Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="notifyCustomer"
              checked={notifyCustomer}
              onChange={(e) => setNotifyCustomer(e.target.checked)}
              className="w-4 h-4 rounded text-[#390044] focus:ring-[#390044] border-zinc-300"
            />
            <label htmlFor="notifyCustomer" className="text-xs text-zinc-700">
              Send transactional notification email to customer ({resolvedCustomer.email})
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-zinc-200/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(conflictWarning)}
              className="px-4 py-2 rounded-md bg-[#390044] text-white text-xs font-semibold hover:bg-[#390044] transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isReschedule ? 'Confirm Reschedule' : 'Save Consultation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
