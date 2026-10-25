'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  MapPin,
  Building,
  Video,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Truck,
  Box,
  HelpCircle,
  ExternalLink,
  Download,
  AlertCircle,
  RefreshCw,
  Globe,
  User,
  Mail,
  FileText,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

interface SlotItem {
  startUtc: string;
  endUtc: string;
  ottawaTime: string;
  customerTime: string;
}

interface PublicConfig {
  allowedChannels: string[];
  slotDurationMinutes: number;
  minNoticeHours: number;
  maxBookingDays: number;
  timeZone: string;
  isGoogleMeetActive: boolean;
  isOfficeConsultationActive?: boolean;
  officeAddress?: string | null;
  channelInstructions: Record<string, string>;
}

const SERVICES = [
  {
    id: 'cleaning',
    title: 'Residential & Commercial Cleaning',
    desc: 'Deep cleaning, turnover service, and regular maintenance for homes and offices.',
    icon: Sparkles,
  },
  {
    id: 'moving',
    title: 'Local & Long-Distance Moving',
    desc: 'Professional residential moving, packing, loading, and secure transit across Ottawa.',
    icon: Truck,
  },
  {
    id: 'storage',
    title: 'Secure Storage Solutions',
    desc: 'Climate-controlled storage space with flexible short-term and long-term terms.',
    icon: Box,
  },
  {
    id: 'combined',
    title: 'Combined / General Consultation',
    desc: 'Integrated cleaning, moving, and storage planning for home transitions.',
    icon: HelpCircle,
  },
];

const CHANNELS = [
  {
    id: 'telephone',
    title: 'Telephone Consultation',
    desc: 'A Laurrel coordinator will initiate a phone call at the scheduled consultation time.',
    icon: Phone,
    badge: 'Direct Phone',
    disabled: false,
  },
  {
    id: 'google_meet',
    title: 'Google Meet (Video Consultation)',
    desc: 'A dedicated video conference with automated link generation for visual walkthroughs.',
    icon: Video,
    badge: 'Video Call',
    disabled: false,
  },
  {
    id: 'on_site',
    title: 'On-Site Property Assessment',
    desc: 'A field coordinator visits your Ottawa home or facility for accurate measurement.',
    icon: MapPin,
    badge: 'Ottawa In-Person',
    disabled: false,
  },
  {
    id: 'in_person',
    title: 'Office Consultation',
    desc: 'Meet in-person with our operations team at our Ottawa headquarters.',
    icon: Building,
    badge: 'Office Visit',
    disabled: false,
  },
  {
    id: 'ms_teams',
    title: 'Microsoft Teams',
    desc: 'Direct integration in development. Please select Google Meet or Telephone consultation.',
    icon: Video,
    badge: 'In Development',
    disabled: true,
  },
  {
    id: 'zoom',
    title: 'Zoom Meetings',
    desc: 'Direct integration in development. Please select Google Meet or Telephone consultation.',
    icon: Video,
    badge: 'In Development',
    disabled: true,
  },
];

const POPULAR_TIMEZONES = [
  { value: 'America/Toronto', label: 'Ottawa, Toronto, New York (EDT/EST)' },
  { value: 'America/Vancouver', label: 'Vancouver, Los Angeles (PDT/PST)' },
  { value: 'America/Edmonton', label: 'Edmonton, Calgary, Denver (MDT/MST)' },
  { value: 'America/Winnipeg', label: 'Winnipeg, Chicago (CDT/CST)' },
  { value: 'America/Halifax', label: 'Halifax (ADT/AST)' },
  { value: 'America/St_Johns', label: "St. John's, NL (NDT/NST)" },
  { value: 'Europe/London', label: 'London, Dublin (BST/GMT)' },
  { value: 'Africa/Lagos', label: 'Lagos, West Africa Time (WAT)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
];

export default function PublicBookingPage() {
  const [step, setStep] = useState<number>(1);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  // Form State
  const [selectedService, setSelectedService] = useState<string>('cleaning');
  const [selectedChannel, setSelectedChannel] = useState<string>('telephone');

  // Timezone State
  const [customerTimezone, setCustomerTimezone] = useState<string>('America/Toronto');

  // Calendar & Slot State
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);

  // Customer Contact State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [serviceAddress, setServiceAddress] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');

  // Booking Execution State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);
  const [managementToken, setManagementToken] = useState<string | null>(null);
  const [logicalAttemptKey, setLogicalAttemptKey] = useState<string>('');

  // Generate a stable idempotency key per logical booking attempt; regenerate only when booking parameters change
  useEffect(() => {
    setLogicalAttemptKey(`bk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
  }, [selectedService, selectedChannel, selectedSlot?.startUtc, customerEmail]);

  // Detect user's browser timezone on mount
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setCustomerTimezone(detected);
      }
    } catch {
      setCustomerTimezone('America/Toronto');
    }
  }, []);

  // Fetch Public Booking Config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoadingConfig(true);
        const res = await fetch('/api/public/appointments/config');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setConfig(data);
            if (!data.isOfficeConsultationActive && selectedChannel === 'in_person') {
              setSelectedChannel('telephone');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load booking config:', err);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  // Set default selected date (tomorrow in Ottawa)
  useEffect(() => {
    if (!selectedDateStr) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const y = tomorrow.getFullYear();
      const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const d = String(tomorrow.getDate()).padStart(2, '0');
      setSelectedDateStr(`${y}-${m}-${d}`);
    }
  }, [selectedDateStr]);

  // Load available slots when date, channel, or timezone changes
  useEffect(() => {
    if (!selectedDateStr) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSlotError(null);
      setSelectedSlot(null);

      try {
        const query = new URLSearchParams({
          date: selectedDateStr,
          type: selectedChannel,
          timezone: customerTimezone,
        });

        const res = await fetch(`/api/public/appointments/availability?${query.toString()}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setAvailableSlots(data.slots || []);
          if (!data.dayEnabled) {
            setSlotError(data.message || 'Consultations are not available on this day.');
          } else if (data.slots.length === 0) {
            setSlotError(data.message || 'All consultation slots are currently booked for this date. Please select another day.');
          }
        } else {
          setSlotError(data.error || 'Failed to retrieve available times.');
        }
      } catch (err: any) {
        setSlotError('Scheduling network error. Please refresh or try again.');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDateStr, selectedChannel, customerTimezone]);

  // Handle final booking submission
  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Reuse stable idempotency key across retries and transient failures
      const idempKey = logicalAttemptKey || `bk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      if (!logicalAttemptKey) setLogicalAttemptKey(idempKey);

      const res = await fetch('/api/public/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempKey,
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim() || undefined,
          serviceType: selectedService,
          appointmentType: selectedChannel,
          startUtc: selectedSlot.startUtc,
          customerTimezone,
          serviceAddress: serviceAddress.trim() || undefined,
          customerNotes: customerNotes.trim() || undefined,
          idempotencyKey: idempKey,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setConfirmedBooking(data.appointment);
        setManagementToken(data.managementToken);
        setStep(6);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(data.error || 'Booking could not be finalized.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar Day Click
  const handleDaySelect = (dayNum: number) => {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    setSelectedDateStr(`${y}-${m}-${d}`);
  };

  // Month Days Calculator
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Convert to Monday-first (0 is Monday, 6 is Sunday)
    const startOffset = (firstDayIndex + 6) % 7;

    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: { day: number; currentMonth: boolean; isPast: boolean }[] = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false, isPast: true });
    }

    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= totalDays; i++) {
      const candidate = new Date(year, month, i);
      candidate.setHours(0, 0, 0, 0);
      days.push({ day: i, currentMonth: true, isPast: candidate < today });
    }

    // Next month padding to fill grid to multiple of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, isPast: false });
    }

    return days;
  };

  const isSelectedDate = (dayNum: number) => {
    if (!selectedDateStr) return false;
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    return (
      currentMonth.getFullYear() === y &&
      currentMonth.getMonth() + 1 === m &&
      dayNum === d
    );
  };

  // Download ICS File
  const handleDownloadIcs = () => {
    if (!managementToken) return;
    window.location.href = `/api/public/appointments/${managementToken}/ics`;
  };

  // Google Calendar Web Intent Link
  const getGoogleCalendarWebLink = () => {
    if (!confirmedBooking) return '#';
    const startStr = new Date(confirmedBooking.scheduledStart).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endStr = new Date(confirmedBooking.scheduledEnd).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: confirmedBooking.title || 'Laurrel Services Consultation',
      dates: `${startStr}/${endStr}`,
      details: `Laurrel Services Consultation\nType: ${confirmedBooking.appointmentType}\nLink / Location: ${confirmedBooking.locationOrLink || 'Telephone Call'}\nSelf-service manage link: ${window.location.origin}/book/${managementToken}`,
      location: confirmedBooking.locationOrLink || 'Telephone Consultation',
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#202024] font-sans antialiased selection:bg-[#390044]/15">
      {/* Brand Navigation Header */}
      <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="select-none block" title="Laurrel Services">
            <Logo priority className="h-8" />
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-semibold text-zinc-500">
              Customer Consultation Booking
            </span>
            <Link
              href="/"
              className="text-xs font-semibold text-[#390044] hover:text-[#390044] px-3 py-1.5 rounded-md bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              Return to Website
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Stepper Header (Only shown during steps 1-5) */}
        {step < 6 && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
                  Book a Consultation
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                  Connect with a Laurrel coordinator to plan your Ottawa cleaning, moving, or storage scope.
                </p>
              </div>

              {/* Ottawa Timezone Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/80 text-xs font-medium text-zinc-600 self-start sm:self-auto">
                <Globe className="w-3.5 h-3.5 text-[#390044]" />
                <span>Ottawa, ON (America/Toronto)</span>
              </div>
            </div>

            {/* Step Progress Bar */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {[
                { s: 1, label: 'Service' },
                { s: 2, label: 'Format' },
                { s: 3, label: 'Date & Time' },
                { s: 4, label: 'Your Details' },
                { s: 5, label: 'Review' },
              ].map(({ s, label }) => (
                <div key={s} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      step >= s ? 'bg-[#390044]' : 'bg-zinc-200'
                    }`}
                  />
                  <div
                    className={`text-[10px] sm:text-xs font-semibold hidden sm:block ${
                      step >= s ? 'text-[#390044]' : 'text-zinc-400'
                    }`}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: SELECT PURPOSE / SERVICE */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#390044]">Step 1 of 5</span>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 mt-1">
                What service would you like to discuss?
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Our specialists will prepare relevant service scope and pricing guidance prior to our call.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SERVICES.map((srv) => {
                const Icon = srv.icon;
                const isSelected = selectedService === srv.id;

                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setSelectedService(srv.id)}
                    className={`text-left p-5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50/40 border-[#390044] shadow-sm ring-1 ring-[#390044]'
                        : 'bg-white border-zinc-200/90 hover:border-zinc-300 hover:bg-zinc-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-[#390044] text-white' : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#390044] bg-[#390044] text-white' : 'border-zinc-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 leading-snug">{srv.title}</h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{srv.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-lg bg-[#390044] text-white hover:bg-[#390044] text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: SELECT MEETING FORMAT */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#390044]">Step 2 of 5</span>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 mt-1">
                How would you prefer to connect?
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Choose between telephone, automated Google Meet video, on-site assessment, or office consultation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const isSelected = selectedChannel === ch.id;

                // Channel availability check
                const isGoogleMeetOffline =
                  ch.id === 'google_meet' && Boolean(config && !config.isGoogleMeetActive);
                const isOfficeUnavailable =
                  ch.id === 'in_person' && Boolean(config && !config.isOfficeConsultationActive);
                const isDisabled = ch.disabled || isGoogleMeetOffline || isOfficeUnavailable;

                return (
                  <button
                    key={ch.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) setSelectedChannel(ch.id);
                    }}
                    className={`text-left p-5 rounded-xl border transition-all flex flex-col justify-between ${
                      isDisabled
                        ? 'bg-zinc-50/80 border-zinc-200/60 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-purple-50/40 border-[#390044] shadow-sm ring-1 ring-[#390044] cursor-pointer'
                        : 'bg-white border-zinc-200/90 hover:border-zinc-300 hover:bg-zinc-50/50 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isSelected && !isDisabled
                              ? 'bg-[#390044] text-white'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          ch.disabled || isOfficeUnavailable
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-zinc-100 text-zinc-500'
                        }`}>
                          {isOfficeUnavailable ? 'Unavailable' : ch.badge}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 leading-snug">{ch.title}</h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{ch.desc}</p>
                    </div>

                    {isGoogleMeetOffline && (
                      <div className="mt-3 text-[11px] font-medium text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Google Meet offline — please select Telephone or On-Site assessment.</span>
                      </div>
                    )}
                    {isOfficeUnavailable && (
                      <div className="mt-3 text-[11px] font-medium text-amber-800 bg-amber-50/80 p-2 rounded border border-amber-200 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>Office consultations are temporarily unavailable (no verified meeting location configured). Please select Telephone, Google Meet, or On-Site assessment.</span>
                      </div>
                    )}
                    {ch.id === 'in_person' && config?.isOfficeConsultationActive && config.officeAddress && (
                      <div className="mt-3 text-[11px] text-zinc-600 bg-zinc-50 p-2 rounded border border-zinc-200 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-[#390044] mt-0.5" />
                        <span>Location: {config.officeAddress}</span>
                      </div>
                    )}
                    {ch.disabled && !isOfficeUnavailable && (
                      <div className="mt-3 text-[11px] font-medium text-amber-800 bg-amber-50/80 p-2 rounded border border-amber-200 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>Channel in active development — coming soon.</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-lg bg-[#390044] text-white hover:bg-[#390044] text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Schedule</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: INTERACTIVE CALENDAR & TIME SLOT PICKER */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#390044]">Step 3 of 5</span>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 mt-1">
                  Select Consultation Date & Time
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Available slots reflect Ottawa business hours and coordinator calendar free/busy availability.
                </p>
              </div>

              {/* Timezone Switcher */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
                <select
                  value={customerTimezone}
                  onChange={(e) => setCustomerTimezone(e.target.value)}
                  className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#390044] cursor-pointer"
                >
                  {POPULAR_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
              {/* Left Column: Interactive Month Calendar */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <h3 className="text-sm font-bold text-zinc-900">
                    {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = new Date(currentMonth);
                        prev.setMonth(prev.getMonth() - 1);
                        setCurrentMonth(prev);
                      }}
                      className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                      title="Previous month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Date(currentMonth);
                        next.setMonth(next.getMonth() + 1);
                        setCurrentMonth(next);
                      }}
                      className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                      title="Next month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day Headers (Mon - Sun) */}
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-zinc-400 uppercase">
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                  <div>Sun</div>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {getCalendarDays().map((d, idx) => {
                    if (!d.currentMonth) {
                      return (
                        <div
                          key={idx}
                          className="h-10 sm:h-11 flex items-center justify-center text-xs text-zinc-300 select-none"
                        >
                          {d.day}
                        </div>
                      );
                    }

                    const selected = isSelectedDate(d.day);

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={d.isPast}
                        onClick={() => handleDaySelect(d.day)}
                        className={`h-10 sm:h-11 rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer ${
                          d.isPast
                            ? 'text-zinc-300 cursor-not-allowed'
                            : selected
                            ? 'bg-[#390044] text-white shadow-sm font-bold'
                            : 'text-zinc-800 hover:bg-purple-50 hover:text-[#390044]'
                        }`}
                      >
                        {d.day}
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/60 text-[11px] text-zinc-500 leading-relaxed">
                  Ottawa headquarters operating hours: <span className="font-semibold text-zinc-700">Mon–Fri 8:00 AM – 6:00 PM · Sat 9:00 AM – 4:00 PM</span>.
                </div>
              </div>

              {/* Right Column: Time Slots */}
              <div className="lg:col-span-5 space-y-3.5 border-t lg:border-t-0 lg:border-l border-zinc-200/80 lg:pl-8 pt-6 lg:pt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-900">Available Times</h3>
                  <span className="text-[11px] text-zinc-500 font-medium">30-min slots</span>
                </div>

                {loadingSlots ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
                    <RefreshCw className="w-5 h-5 text-[#390044] animate-spin" />
                    <span>Checking coordinator availability...</span>
                  </div>
                ) : slotError ? (
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70 text-xs text-zinc-600 space-y-1">
                    <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Notice</span>
                    </div>
                    <p>{slotError}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {availableSlots.map((slot, idx) => {
                      const isSelected = selectedSlot?.startUtc === slot.startUtc;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-purple-50/50 border-[#390044] text-zinc-900 shadow-2xs ring-1 ring-[#390044]'
                              : 'bg-white border-zinc-200/90 hover:border-zinc-300 text-zinc-800'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-snug">{slot.customerTime}</div>
                            {customerTimezone !== 'America/Toronto' && (
                              <div className="text-[10px] text-zinc-500 mt-0.5">
                                Ottawa time: {slot.ottawaTime}
                              </div>
                            )}
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-[#390044] bg-[#390044] text-white' : 'border-zinc-300'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={!selectedSlot}
                onClick={() => setStep(4)}
                className={`px-6 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2 ${
                  selectedSlot
                    ? 'bg-[#390044] text-white hover:bg-[#390044] cursor-pointer'
                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                }`}
              >
                <span>Continue to Your Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: ENTER CUSTOMER DETAILS */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#390044]">Step 4 of 5</span>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 mt-1">
                Your Contact Information
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                We will email your consultation confirmation and calendar invite to this address.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Marcus Vance"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#390044] focus:bg-white transition-all"
                    />
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="e.g. marcus@example.ca"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#390044] focus:bg-white transition-all"
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Phone Number {selectedChannel === 'telephone' && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required={selectedChannel === 'telephone'}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. (613) 555-0192"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#390044] focus:bg-white transition-all"
                    />
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Ottawa Service Address {selectedChannel === 'on_site' && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required={selectedChannel === 'on_site'}
                      value={serviceAddress}
                      onChange={(e) => setServiceAddress(e.target.value)}
                      placeholder="e.g. 150 Elgin St, Ottawa, ON"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#390044] focus:bg-white transition-all"
                    />
                    <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Property Scope, Square Footage, or Moving Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Tell us about the home layout, number of bedrooms, moving destination, or specific cleaning requirements..."
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#390044] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={
                  !customerName.trim() ||
                  !customerEmail.includes('@') ||
                  (selectedChannel === 'telephone' && !customerPhone.trim()) ||
                  (selectedChannel === 'on_site' && (!serviceAddress.trim() || serviceAddress.trim().length < 5))
                }
                onClick={() => setStep(5)}
                className={`px-6 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2 ${
                  customerName.trim() && customerEmail.includes('@') && (selectedChannel !== 'telephone' || customerPhone.trim()) && (selectedChannel !== 'on_site' || serviceAddress.trim())
                    ? 'bg-[#390044] text-white hover:bg-[#390044] cursor-pointer'
                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                }`}
              >
                <span>Review Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: REVIEW & ATOMIC BOOKING SUBMISSION */}
        {/* ========================================================================= */}
        {step === 5 && selectedSlot && (
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#390044]">Step 5 of 5</span>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 mt-1">
                Review & Confirm Consultation
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Please verify your consultation details before finalizing your booking.
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-zinc-200/60">
                <div>
                  <span className="text-zinc-500 font-medium">Service Scope</span>
                  <div className="font-bold text-zinc-900 text-sm capitalize mt-0.5">
                    {SERVICES.find((s) => s.id === selectedService)?.title}
                  </div>
                </div>

                <div>
                  <span className="text-zinc-500 font-medium">Meeting Format</span>
                  <div className="font-bold text-zinc-900 text-sm mt-0.5">
                    {CHANNELS.find((c) => c.id === selectedChannel)?.title}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-zinc-200/60">
                <div>
                  <span className="text-zinc-500 font-medium">Consultation Date & Time</span>
                  <div className="font-bold text-zinc-900 text-sm mt-0.5">
                    {selectedSlot.customerTime}
                  </div>
                  {customerTimezone !== 'America/Toronto' && (
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      Ottawa Time: {selectedSlot.ottawaTime}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-zinc-500 font-medium">Client Contact</span>
                  <div className="font-bold text-zinc-900 text-sm mt-0.5">{customerName}</div>
                  <div className="text-zinc-600 mt-0.5">{customerEmail}</div>
                  {customerPhone && <div className="text-zinc-600">{customerPhone}</div>}
                </div>
              </div>

              {serviceAddress && (
                <div>
                  <span className="text-zinc-500 font-medium">Service Location</span>
                  <div className="font-bold text-zinc-900 text-sm mt-0.5">{serviceAddress}</div>
                </div>
              )}

              {selectedChannel === 'in_person' && config?.officeAddress && (
                <div>
                  <span className="text-zinc-500 font-medium">Laurrel Consultation Office</span>
                  <div className="font-bold text-zinc-900 text-sm mt-0.5">{config.officeAddress}</div>
                </div>
              )}

              {selectedChannel === 'in_person' && config?.officeAddress && (
                <div>
                  <span className="text-zinc-500 font-medium">Laurrel Consultation Office</span>
                  <div className="font-bold text-zinc-900 text-sm mt-0.5">{config.officeAddress}</div>
                </div>
              )}

              {customerNotes && (
                <div>
                  <span className="text-zinc-500 font-medium">Customer Notes</span>
                  <div className="text-zinc-700 italic mt-0.5">{customerNotes}</div>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-lg bg-purple-50/50 border border-purple-200/70 text-[11px] text-zinc-600 leading-relaxed">
              Upon confirmation, you will receive an automated confirmation email containing your direct appointment link, iCalendar (.ics) invite, and a secure self-service portal link to reschedule or cancel if needed.
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep(4)}
                className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmBooking}
                className="px-6 py-2.5 rounded-lg bg-[#390044] text-white hover:bg-[#390044] text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Reserving Consultation...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Consultation</span>
                    <Check className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: CONFIRMATION VIEW */}
        {/* ========================================================================= */}
        {step === 6 && confirmedBooking && (
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 sm:p-10 space-y-8 text-center max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Booking Confirmed
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 mt-3">
                Your Consultation is Scheduled!
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 max-w-md mx-auto">
                We have sent your confirmation email and calendar invitation to{' '}
                <span className="font-semibold text-zinc-800">{confirmedBooking.customerEmail}</span>.
              </p>
            </div>

            {/* Confirmed Details Card */}
            <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-left space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60">
                <span className="font-semibold text-zinc-500">Booking Reference</span>
                <span className="font-mono font-bold text-zinc-900">{confirmedBooking.id}</span>
              </div>

              <div className="flex items-start justify-between pb-3 border-b border-zinc-200/60">
                <span className="font-semibold text-zinc-500">Consultation Title</span>
                <span className="font-bold text-zinc-900 text-right">{confirmedBooking.title}</span>
              </div>

              {confirmedBooking.locationOrLink && (
                <div className="flex items-start justify-between pb-3 border-b border-zinc-200/60">
                  <span className="font-semibold text-zinc-500">
                    {confirmedBooking.appointmentType === 'google_meet' ? 'Meeting URL' : 'Location / Phone'}
                  </span>
                  {confirmedBooking.appointmentType === 'google_meet' ? (
                    <a
                      href={confirmedBooking.locationOrLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#390044] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Join Google Meet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="font-medium text-zinc-900">{confirmedBooking.locationOrLink}</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-500">Assigned Coordinator</span>
                <span className="font-medium text-zinc-900">
                  {confirmedBooking.assignedStaffName || 'Laurrel Operations Specialist'}
                </span>
              </div>
            </div>

            {/* Add to Calendar & Download Actions */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Add to Your Calendar</div>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <a
                  href={getGoogleCalendarWebLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-[#390044]" />
                  <span>Google Calendar</span>
                </a>
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Download .ICS (Apple / Outlook)</span>
                </button>
              </div>
            </div>

            {/* Customer Self-Service Link */}
            {managementToken && (
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/70 text-xs text-zinc-600 space-y-1.5 text-left">
                <div className="font-semibold text-zinc-900">Need to make changes later?</div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  You can reschedule or cancel your consultation at any time using your private management link:
                </p>
                <Link
                  href={`/book/${managementToken}`}
                  className="inline-flex items-center gap-1 font-semibold text-[#390044] hover:underline text-xs"
                >
                  <span>Manage or Reschedule Your Booking</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            <div className="pt-4 border-t border-zinc-100">
              <Link
                href="/"
                className="px-6 py-2.5 rounded-lg bg-[#390044] text-white hover:bg-[#390044] text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-1.5"
              >
                <span>Return to Laurrel Services</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
