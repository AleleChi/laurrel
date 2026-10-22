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
  onScheduled: (appointment: any) => void;
  enquiry: {
    id: string;
    customer: {
      name: string;
      email: string;
      phone?: string;
    };
    services: string[];
    serviceLocation?: string;
    preferredTiming?: string;
    details?: string;
  };
  rescheduleAppointmentId?: string | null;
  initialAppointment?: any | null;
}

export default function ScheduleMeetingModal({
  isOpen,
  onClose,
  onScheduled,
  enquiry,
  rescheduleAppointmentId,
  initialAppointment,
}: ScheduleMeetingModalProps) {
  const isReschedule = Boolean(rescheduleAppointmentId);

  // Form states
  const defaultServicesTitle =
    enquiry.services && enquiry.services.length > 0
      ? `${enquiry.services.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' & ')} Consultation`
      : 'Customer Consultation';

  const [title, setTitle] = useState(
    initialAppointment?.title || `${defaultServicesTitle} — ${enquiry.customer.name}`
  );
  const [purpose, setPurpose] = useState(
    initialAppointment?.purpose || 'Review scope, schedule, and estimate requirements'
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
      setLocationOrLink(enquiry.customer.phone || 'Customer telephone number');
    } else if (appointmentType === 'on_site') {
      setLocationOrLink(enquiry.serviceLocation || 'Customer service address (Ottawa)');
    } else if (appointmentType === 'in_person') {
      setLocationOrLink('Laurrel Services Office (Ottawa, ON)');
    } else {
      setLocationOrLink('');
    }
  }, [appointmentType, enquiry.customer.phone, enquiry.serviceLocation]);

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
      // Validate inputs
      if (!title.trim()) throw new Error('Meeting title is required.');
      if (!dateStr || !timeStr) throw new Error('Valid date and time are required.');

      // Construct scheduled start timestamp accurately in America/Toronto timezone
      const scheduledStart = ottawaToUtcIso(dateStr, timeStr);
      const assignedStaff = staffList.find((s) => s.id === selectedStaffId);

      if (conflictWarning) {
        throw new Error(
          'Please resolve the coordinator scheduling conflict before saving the appointment.'
        );
      }

      if (isReschedule && rescheduleAppointmentId) {
        // Call Reschedule API
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

        onScheduled(data.appointment);
        onClose();
      } else {
        // Call Create Appointment API with Idempotency Key
        const idempotencyKey = `idemp_${enquiry.id}_${Date.now()}`;

        const res = await fetch('/api/admin/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            enquiryId: enquiry.id,
            title: title.trim(),
            purpose: purpose.trim(),
            appointmentType,
            scheduledStart,
            durationMinutes,
            customerName: enquiry.customer.name,
            customerEmail: enquiry.customer.email,
            customerPhone: enquiry.customer.phone,
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

        onScheduled(data.appointment);
        onClose();
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred while booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-black/[0.08] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between bg-zinc-50/50">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
              {isReschedule ? 'Reschedule Consultation' : 'Schedule Customer Consultation'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {enquiry.customer.name} · Ref: <span className="font-mono text-zinc-600">{enquiry.id}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Meeting Title & Purpose */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Meeting Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-zinc-50/60 border border-black/[0.1] text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
                placeholder="e.g. Residential Move Consultation"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Consultation Scope / Purpose
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-zinc-50/60 border border-black/[0.1] text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
                placeholder="Brief purpose of the consultation"
              />
            </div>
          </div>

          {/* Appointment Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-2">
              Consultation Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  { type: 'telephone', label: 'Telephone', icon: Phone },
                  { type: 'in_person', label: 'In-Person', icon: User },
                  { type: 'on_site', label: 'On-Site Assessment', icon: MapPin },
                  { type: 'google_meet', label: 'Google Meet', icon: Video },
                  { type: 'ms_teams', label: 'Teams', icon: Video },
                  { type: 'zoom', label: 'Zoom', icon: Video },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const isSelected = appointmentType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setAppointmentType(item.type)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                      isSelected
                        ? 'border-[#49056B] bg-[#49056B]/5 text-[#49056B] shadow-2xs font-semibold'
                        : 'border-black/[0.08] hover:border-zinc-300 text-zinc-600 bg-white'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#49056B]' : 'text-zinc-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Video provider credentials notice */}
            {(appointmentType === 'google_meet' ||
              appointmentType === 'ms_teams' ||
              appointmentType === 'zoom') && (
              <p className="text-[11px] text-zinc-500 mt-2 bg-zinc-50 p-2.5 rounded-lg border border-black/[0.04]">
                <strong>Provider Integration:</strong> Automated URL generation requires backend OAuth credentials. Enter your meeting link below, or leave blank for coordinator manual arrangement.
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
                  className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                    initialStatus === 'confirmed'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-medium ring-1 ring-emerald-500/20'
                      : 'border-black/[0.08] text-zinc-600 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="font-semibold text-emerald-800">Confirmed</div>
                  <div className="text-[11px] text-emerald-700/80">Sends confirmation notice to customer</div>
                </button>
                <button
                  type="button"
                  onClick={() => setInitialStatus('pending')}
                  className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                    initialStatus === 'pending'
                      ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-medium ring-1 ring-amber-500/20'
                      : 'border-black/[0.08] text-zinc-600 bg-white hover:border-zinc-300'
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
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50/60 border border-black/[0.1] text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Start Time (Ottawa) <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50/60 border border-black/[0.1] text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50/60 border border-black/[0.1] text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes (1 hour)</option>
                <option value={90}>90 minutes (1.5 hours)</option>
              </select>
            </div>
          </div>

          {/* Assigned Staff Coordinator */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Assigned Coordinator
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-50/60 border border-black/[0.1] text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
            >
              {loadingStaff ? (
                <option value="">Loading team members...</option>
              ) : staffList.length > 0 ? (
                staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role.replace(/_/g, ' ')})
                  </option>
                ))
              ) : (
                <option value="">Operations Coordinator</option>
              )}
            </select>
            {conflictWarning && (
              <p className="mt-1 text-[11px] text-amber-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{conflictWarning}</span>
              </p>
            )}
          </div>

          {/* Location or Video Link */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              {appointmentType === 'telephone'
                ? 'Customer Telephone Contact'
                : appointmentType === 'in_person' || appointmentType === 'on_site'
                ? 'Meeting Location / Property Address'
                : 'Meeting Link (URL)'}
            </label>
            <input
              type="text"
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-50/60 border border-black/[0.1] text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
              placeholder={
                appointmentType === 'telephone'
                  ? 'Customer phone number'
                  : appointmentType === 'google_meet' || appointmentType === 'ms_teams' || appointmentType === 'zoom'
                  ? 'https://meet.google.com/... or leave blank for coordinator setup'
                  : 'Address in Ottawa area'
              }
            />
          </div>

          {/* Reschedule Reason if rescheduling */}
          {isReschedule && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Reason for Rescheduling
              </label>
              <input
                type="text"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-zinc-50/60 border border-black/[0.1] text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
                placeholder="e.g. Customer requested afternoon time slot"
              />
            </div>
          )}

          {/* Private Staff Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Private Staff Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-50/60 border border-black/[0.1] text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
              placeholder="Internal notes visible only to Laurrel operations staff"
            />
          </div>

          {/* Customer Notification Checkbox */}
          <div className="pt-2 border-t border-black/[0.04]">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="rounded text-[#49056B] focus:ring-[#49056B]/20 w-4 h-4 border-zinc-300"
              />
              <span className="text-xs text-zinc-700 font-medium">
                Send email confirmation to <strong className="text-zinc-900">{enquiry.customer.email}</strong>
              </span>
            </label>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-black/[0.06] bg-zinc-50/50 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">Ottawa Local Time (America/Toronto)</span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-black/[0.1] bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || Boolean(conflictWarning)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#49056B] text-white text-xs font-semibold hover:bg-[#5B0785] disabled:opacity-50 transition-all shadow-2xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Booking...</span>
                </>
              ) : (
                <span>{isReschedule ? 'Update Consultation' : 'Confirm & Schedule'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
