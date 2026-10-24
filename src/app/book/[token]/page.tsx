'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  MapPin,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
  RefreshCw,
  User,
  Mail,
  FileText,
  ShieldCheck,
  CalendarCheck,
  AlertTriangle,
  X,
  Building,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

interface AppointmentData {
  id: string;
  title: string;
  purpose: string;
  appointmentType: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  durationMinutes: number;
  locationOrLink: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  serviceAddress: string | null;
  customerTimezone: string | null;
  assignedStaffName: string | null;
  cancellationReason: string | null;
}

interface SlotItem {
  startUtc: string;
  endUtc: string;
  ottawaTime: string;
  customerTime: string;
}

export default function AppointmentManagementPage() {
  const params = useParams();
  const token = params?.token as string;

  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerTimezone, setCustomerTimezone] = useState('America/Toronto');

  // Modals state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState<string | null>(null);

  // Cancel state
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  // Detect user local timezone
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setCustomerTimezone(detected);
    } catch {
      setCustomerTimezone('America/Toronto');
    }
  }, []);

  // Fetch appointment data
  const fetchAppointment = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/public/appointments/manage/${token}`);
      const data = await res.json();

      if (res.ok && data.success && data.appointment) {
        setAppointment(data.appointment);
        if (data.appointment.customerTimezone) {
          setCustomerTimezone(data.appointment.customerTimezone);
        }
      } else {
        setError(data.error || 'Unable to find your consultation record. The link may have expired or is invalid.');
      }
    } catch {
      setError('Network connection error. Please refresh the page to retry.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  // Set default reschedule date to tomorrow
  useEffect(() => {
    if (showRescheduleModal && !rescheduleDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const y = tomorrow.getFullYear();
      const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const d = String(tomorrow.getDate()).padStart(2, '0');
      setRescheduleDate(`${y}-${m}-${d}`);
    }
  }, [showRescheduleModal, rescheduleDate]);

  // Fetch available slots when reschedule date changes
  useEffect(() => {
    if (!showRescheduleModal || !rescheduleDate || !appointment) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSlotError(null);
      setSelectedSlot(null);

      try {
        const query = new URLSearchParams({
          date: rescheduleDate,
          type: appointment.appointmentType || 'telephone',
          timezone: customerTimezone,
        });

        const res = await fetch(`/api/public/appointments/availability?${query.toString()}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setAvailableSlots(data.slots || []);
          if (!data.dayEnabled) {
            setSlotError(data.message || 'Laurrel coordinators are not available on this day.');
          } else if (data.slots.length === 0) {
            setSlotError(data.message || 'All consultation slots are currently reserved for this date. Please choose another date.');
          }
        } else {
          setSlotError(data.error || 'Failed to retrieve available times.');
        }
      } catch {
        setSlotError('Failed to contact scheduling service.');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [showRescheduleModal, rescheduleDate, appointment, customerTimezone]);

  // Execute Reschedule
  const handleRescheduleSubmit = async () => {
    if (!selectedSlot) return;

    setRescheduling(true);
    setRescheduleError(null);

    try {
      const res = await fetch(`/api/public/appointments/reschedule/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStartUtc: selectedSlot.startUtc }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setRescheduleSuccess('Consultation appointment rescheduled successfully! Updated details have been dispatched to your email.');
        setShowRescheduleModal(false);
        fetchAppointment();
      } else {
        setRescheduleError(data.error || 'Unable to reschedule appointment. The selected time slot may have just been reserved.');
      }
    } catch {
      setRescheduleError('Network error occurred while rescheduling.');
    } finally {
      setRescheduling(false);
    }
  };

  // Execute Cancellation
  const handleCancelSubmit = async () => {
    setCancelling(true);
    setCancelError(null);

    try {
      const res = await fetch(`/api/public/appointments/cancel/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason.trim() || undefined }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCancelSuccess('Your consultation appointment has been cancelled. Confirmation has been emailed to you.');
        setShowCancelModal(false);
        fetchAppointment();
      } else {
        setCancelError(data.error || 'Failed to cancel appointment.');
      }
    } catch {
      setCancelError('Network error occurred while processing cancellation.');
    } finally {
      setCancelling(false);
    }
  };

  // Format Helpers
  const formatOttawaDateTime = (isoString?: string) => {
    if (!isoString) return { datePart: '', timePart: '' };
    const date = new Date(isoString);
    const datePart = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);

    const timePart = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);

    return { datePart, timePart };
  };

  const formatCustomerDateTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const datePart = new Intl.DateTimeFormat('en-US', {
      timeZone: customerTimezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);

    const timePart = new Intl.DateTimeFormat('en-US', {
      timeZone: customerTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(date);

    return `${datePart}, ${timePart}`;
  };

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    if (!appointment) return '#';
    const startIso = new Date(appointment.scheduledStart).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endIso = new Date(appointment.scheduledEnd).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const title = encodeURIComponent(appointment.title || 'Laurrel Services Consultation');
    const details = encodeURIComponent(
      `Laurrel Services Consultation\nFormat: ${appointment.appointmentType}\nCoordinator: ${appointment.assignedStaffName || 'Laurrel Team'}\nManage: ${typeof window !== 'undefined' ? window.location.href : ''}`
    );
    const location = encodeURIComponent(appointment.locationOrLink || 'Ottawa, Ontario');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-6 text-[#202024]">
        <Logo className="h-10 w-auto mb-6" />
        <RefreshCw className="w-8 h-8 text-[#390044] animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">Retrieving your consultation booking...</p>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-6 text-[#202024]">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
          <Logo className="h-10 w-auto mx-auto mb-6" />
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Consultation Not Found</h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {error || 'The consultation booking you are looking for is unavailable or the management link is invalid.'}
          </p>
          <div className="space-y-3">
            <Link
              href="/book"
              className="block w-full py-3 bg-[#390044] hover:bg-[#4a0058] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Book a New Consultation
            </Link>
            <Link
              href="/"
              className="block w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Return to Laurrel Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const startOttawa = formatOttawaDateTime(appointment.scheduledStart);
  const endOttawa = formatOttawaDateTime(appointment.scheduledEnd);
  const isCancelled = appointment.status === 'cancelled';
  const isCompleted = appointment.status === 'completed';
  const isConfirmed = appointment.status === 'confirmed' || appointment.status === 'scheduled';

  const typeLabelMap: Record<string, string> = {
    telephone: 'Telephone Consultation',
    google_meet: 'Google Meet (Video Consultation)',
    on_site: 'On-Site Property Assessment',
    in_person: 'In-Person Consultation (Office)',
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#202024] flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/book"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Book Another Consultation
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Banner feedback */}
        {rescheduleSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-emerald-900 font-medium">{rescheduleSuccess}</div>
            <button onClick={() => setRescheduleSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {cancelSuccess && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-amber-900 font-medium">{cancelSuccess}</div>
            <button onClick={() => setCancelSuccess(null)} className="text-amber-700 hover:text-amber-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Header Status Banner */}
          <div
            className={`px-6 sm:px-8 py-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
              isCancelled
                ? 'bg-rose-50/60 border-rose-100'
                : isCompleted
                ? 'bg-slate-50 border-slate-100'
                : 'bg-[#390044]/5 border-[#390044]/10'
            }`}
          >
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    isCancelled
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : isCompleted
                      ? 'bg-slate-200 text-slate-800 border border-slate-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isCancelled ? (
                    <>
                      <XCircle className="w-3.5 h-3.5" /> Cancelled
                    </>
                  ) : isCompleted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed Consultation
                    </>
                  )}
                </span>
                <span className="text-xs text-slate-500 font-mono">ID: {appointment.id}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {appointment.title || 'Laurrel Services Consultation'}
              </h1>
            </div>

            {/* Quick Action Buttons */}
            {isConfirmed && (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowRescheduleModal(true)}
                  className="px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Body Information */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Cancellation Notice if applicable */}
            {isCancelled && (
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-900 text-sm">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" /> This consultation has been cancelled.
                </p>
                <p className="text-rose-700">
                  Reason:{' '}
                  <span className="font-medium">
                    {appointment.cancellationReason || 'Cancelled by client request via self-service portal.'}
                  </span>
                </p>
              </div>
            )}

            {/* Date, Time & Location Spotlight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ottawa Time Box */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#390044] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Ottawa Local Time (America/Toronto)
                  </div>
                  <div className="text-base font-bold text-slate-900">{startOttawa.datePart}</div>
                  <div className="text-sm font-semibold text-[#390044] mt-0.5">
                    {startOttawa.timePart} – {endOttawa.timePart}
                  </div>
                  {customerTimezone && customerTimezone !== 'America/Toronto' && (
                    <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
                      Your local time: <span className="font-medium text-slate-700">{formatCustomerDateTime(appointment.scheduledStart)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Consultation Format & Join Access */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#C8E80B] text-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm font-bold">
                  {appointment.appointmentType === 'google_meet' ? (
                    <Video className="w-5 h-5" />
                  ) : appointment.appointmentType === 'telephone' ? (
                    <Phone className="w-5 h-5" />
                  ) : appointment.appointmentType === 'on_site' ? (
                    <MapPin className="w-5 h-5" />
                  ) : (
                    <Building className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Consultation Format
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    {typeLabelMap[appointment.appointmentType] || appointment.appointmentType}
                  </div>

                  {/* Channel specifics */}
                  {appointment.appointmentType === 'google_meet' && (
                    <div className="mt-2">
                      {appointment.locationOrLink &&
                      /^https:\/\//i.test(appointment.locationOrLink) &&
                      !appointment.locationOrLink.includes('calendar.google.com') ? (
                        <a
                          href={appointment.locationOrLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#390044] text-white rounded-lg text-xs font-semibold hover:bg-[#4d035b] transition-colors shadow-sm"
                        >
                          Join Google Meet
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/60 text-xs text-amber-800">
                          <p className="font-semibold">Video meeting link pending coordinator setup</p>
                          <p className="text-[11px] text-amber-700 mt-0.5">
                            Your coordinator is finalizing the video conference details and will send an updated link prior to your consultation.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {appointment.appointmentType === 'telephone' && (
                    <div className="text-xs text-slate-600 mt-1">
                      Our team will place an outbound call to:{' '}
                      <span className="font-bold text-slate-900">
                        {appointment.customerPhone || 'Your registered number'}
                      </span>
                    </div>
                  )}

                  {appointment.appointmentType === 'on_site' && (
                    <div className="text-xs text-slate-600 mt-1">
                      Estimator property visit at:{' '}
                      <span className="font-bold text-slate-900">
                        {appointment.serviceAddress || 'Ottawa property address'}
                      </span>
                    </div>
                  )}

                  {appointment.appointmentType === 'in_person' && (
                    <div className="text-xs text-slate-600 mt-1">
                      Location: <span className="font-bold text-slate-900">Laurrel Services Office, Ottawa, ON</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Coordinator & Customer Detail Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              {/* Coordinator Assigned */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Laurrel Consultation Staff
                </h3>
                <div className="p-4 rounded-xl border border-slate-200/70 bg-white">
                  <div className="text-sm font-bold text-slate-900">
                    {appointment.assignedStaffName || 'Laurrel Operations Team Coordinator'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Dedicated Customer Service Specialist</div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Laurrel Verified Staff Coordinator</span>
                  </div>
                </div>
              </div>

              {/* Customer Contact Details */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Client Contact Information
                </h3>
                <div className="p-4 rounded-xl border border-slate-200/70 bg-white space-y-1.5 text-sm">
                  <div className="font-semibold text-slate-900">{appointment.customerName}</div>
                  <div className="text-slate-600 text-xs flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {appointment.customerEmail}
                  </div>
                  {appointment.customerPhone && (
                    <div className="text-slate-600 text-xs flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {appointment.customerPhone}
                    </div>
                  )}
                  {appointment.serviceAddress && (
                    <div className="text-slate-600 text-xs flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {appointment.serviceAddress}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Calendar Export Section */}
            {isConfirmed && (
              <div className="p-5 rounded-2xl bg-[#390044]/5 border border-[#390044]/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#390044] border border-[#390044]/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Synchronize with your Calendar</h4>
                    <p className="text-xs text-slate-600">Add this consultation to Apple Calendar, Google Calendar, or Outlook.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <a
                    href={`/api/public/appointments/${token}/ics`}
                    download
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    Download .ICS
                  </a>
                  <a
                    href={getGoogleCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#390044] hover:bg-[#4d035b] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Add to Google Calendar
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assistance / Support box */}
        <div className="mt-8 p-6 rounded-2xl bg-white border border-slate-200 text-center max-w-xl mx-auto">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Need to change arrangements or have questions?</h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Our Ottawa team is available Monday through Saturday to answer any questions about your upcoming cleaning, moving, or storage consultation.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs font-semibold text-[#390044]">
            <a href="tel:+16135550199" className="flex items-center gap-1.5 hover:underline">
              <Phone className="w-3.5 h-3.5" /> +1 (613) 555-0199
            </a>
            <a href="mailto:info@laurrelservices.ca" className="flex items-center gap-1.5 hover:underline">
              <Mail className="w-3.5 h-3.5" /> info@laurrelservices.ca
            </a>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* RESCHEDULE MODAL */}
      {/* ========================================================================= */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reschedule Consultation</h3>
                <p className="text-xs text-slate-500">Select a new date and time with Laurrel coordinators</p>
              </div>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {rescheduleError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{rescheduleError}</span>
                </div>
              )}

              {/* Date selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Consultation Date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#390044] focus:outline-none"
                />
              </div>

              {/* Slots selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Available Ottawa Time Slots
                </label>
                {loadingSlots ? (
                  <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#390044]" /> Checking coordinator schedules...
                  </div>
                ) : slotError ? (
                  <div className="py-6 px-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-600">
                    {slotError}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="py-6 px-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-600">
                    No slots available on this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot?.startUtc === slot.startUtc;
                      return (
                        <button
                          key={slot.startUtc}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                            isSelected
                              ? 'bg-[#390044] text-white border-[#390044] shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div>{slot.ottawaTime}</div>
                          {slot.customerTime !== slot.ottawaTime && (
                            <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                              {slot.customerTime}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRescheduleSubmit}
                disabled={!selectedSlot || rescheduling}
                className="px-5 py-2 bg-[#390044] hover:bg-[#4d035b] disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm flex items-center gap-2"
              >
                {rescheduling && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CANCEL MODAL */}
      {/* ========================================================================= */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-rose-100 bg-rose-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-800 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-rose-600" /> Cancel Consultation
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-rose-100/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {cancelError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  {cancelError}
                </div>
              )}
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you wish to cancel this consultation? This will release your reserved slot back to the public booking calendar.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please share your reason to help us improve our service..."
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Keep Consultation
              </button>
              <button
                type="button"
                onClick={handleCancelSubmit}
                disabled={cancelling}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm flex items-center gap-2"
              >
                {cancelling && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
