'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  PhoneCall,
  MapPin,
  Video,
  Building2,
  AlertCircle,
  Loader2,
  CalendarDays,
  CheckCircle2,
  Bell,
  FileText,
  User,
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
import { AdminButton } from '@/components/admin/ui/AdminButton';

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

  // Normalize enquiry and customer data
  const resolvedEnquiryId = enquiry?.id || enquiryId || '';
  const resolvedCustomer = enquiry?.customer || customer || { name: 'Customer', email: '' };
  const resolvedServices = enquiry?.services || [];
  const resolvedLocation = enquiry?.serviceLocation || '';

  const notifySuccess = (apt: any) => {
    if (onScheduled) onScheduled(apt);
    if (onSuccess) onSuccess(apt);
  };

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

  // Default to tomorrow at 10:00 AM Ottawa time
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

  // Idempotency key
  const [bookingIdempotencyKey, setBookingIdempotencyKey] = useState<string>(() =>
    `idemp_${resolvedEnquiryId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  );

  useEffect(() => {
    if (isOpen && !isReschedule) {
      setBookingIdempotencyKey(
        `idemp_${resolvedEnquiryId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      );
    }
  }, [isOpen, resolvedEnquiryId, isReschedule]);

  // Conflict & submission states
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load staff members
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

  // Check schedule conflicts
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

  const formatOptions = [
    { type: 'telephone', label: 'Phone Call', icon: PhoneCall },
    { type: 'in_person', label: 'Office Visit', icon: Building2 },
    { type: 'on_site', label: 'Property Visit', icon: MapPin },
    { type: 'google_meet', label: 'Google Meet', icon: Video },
    { type: 'ms_teams', label: 'Teams', icon: Video },
    { type: 'zoom', label: 'Zoom', icon: Video },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-md shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">
              {isReschedule ? 'Reschedule Consultation' : 'Schedule Customer Consultation'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Customer: <span className="font-semibold text-zinc-800">{resolvedCustomer.name}</span>
              {resolvedEnquiryId && (
                <span> • Ref: #{resolvedEnquiryId.slice(0, 8)}</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {formError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Customer and Consultation Purpose */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 pb-1 border-b border-zinc-100 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#49056B]" />
              <span>1. Consultation Purpose</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  Meeting Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-zinc-300 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
                  placeholder="e.g. Residential Move Consultation"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  Consultation Scope / Scope Notes
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-zinc-300 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
                  placeholder="Scope review, packing assessment, inventory inspection..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Consultation Format */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 pb-1 border-b border-zinc-100 flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-[#49056B]" />
              <span>2. Consultation Format</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {formatOptions.map((item) => {
                const Icon = item.icon;
                const isSelected = appointmentType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setAppointmentType(item.type)}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-sm text-left transition-all ${
                      isSelected
                        ? 'border-[#49056B] bg-purple-50/70 text-[#49056B] font-semibold ring-1 ring-[#49056B]'
                        : 'border-zinc-300 hover:border-zinc-400 text-zinc-700 bg-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#49056B]' : 'text-zinc-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Date, Ottawa Time & Duration */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 pb-1 border-b border-zinc-100 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#49056B]" />
              <span>3. Schedule & Ottawa Timing</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  Time (Ottawa) <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-zinc-500">
              Times are scheduled in Eastern Time (America/Toronto / Ottawa, ON).
            </p>
          </div>

          {/* Section 4: Assigned Coordinator */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 pb-1 border-b border-zinc-100 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#49056B]" />
              <span>4. Assigned Staff Coordinator</span>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                Staff Member
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                disabled={loadingStaff}
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
              >
                {staffList.length === 0 ? (
                  <option value="">{loadingStaff ? 'Loading staff...' : 'No staff available'}</option>
                ) : (
                  staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role})
                    </option>
                  ))
                )}
              </select>
            </div>

            {conflictWarning && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{conflictWarning}</span>
              </div>
            )}
          </div>

          {/* Section 5: Meeting Details / Location / Link */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 pb-1 border-b border-zinc-100 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#49056B]" />
              <span>5. Meeting Details & Coordinates</span>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                {appointmentType === 'telephone'
                  ? 'Phone Number'
                  : ['google_meet', 'ms_teams', 'zoom'].includes(appointmentType)
                  ? 'Meeting URL'
                  : 'Location / Address'}
              </label>
              <input
                type="text"
                value={locationOrLink}
                onChange={(e) => setLocationOrLink(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
                placeholder={
                  appointmentType === 'telephone'
                    ? 'Customer phone number'
                    : ['google_meet', 'ms_teams', 'zoom'].includes(appointmentType)
                    ? 'https://meet.google.com/...'
                    : '123 Main St, Ottawa, ON'
                }
              />
            </div>
          </div>

          {/* Section 6: Internal Notes & Notification */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 pb-1 border-b border-zinc-100 flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-[#49056B]" />
              <span>6. Internal Notes & Notifications</span>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                Staff Notes (Internal)
              </label>
              <textarea
                rows={2}
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                className="w-full p-3 rounded-lg bg-white border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
                placeholder="Optional notes for internal coordination..."
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="w-4 h-4 rounded text-[#49056B] focus:ring-[#49056B] border-zinc-300"
              />
              <span className="text-sm text-zinc-700">
                Send appointment confirmation & calendar invitation to customer ({resolvedCustomer.email})
              </span>
            </label>
          </div>

          {/* Reschedule reason if applicable */}
          {isReschedule && (
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <label className="block text-[13px] font-medium text-zinc-700">
                Reschedule Reason
              </label>
              <input
                type="text"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B]"
                placeholder="e.g. Customer requested alternate time slot"
              />
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
            <AdminButton
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </AdminButton>

            <AdminButton
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={Boolean(conflictWarning)}
            >
              {isReschedule ? 'Save Rescheduled Time' : 'Confirm Consultation'}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
