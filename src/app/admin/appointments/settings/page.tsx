'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Shield,
  Video,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Save,
  Trash2,
  Sliders,
  Phone,
  MapPin,
  Building,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface WorkingDaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

interface AppointmentSettings {
  id: string;
  workingDays: Record<DayOfWeek, WorkingDaySchedule>;
  bufferMinutes: number;
  minNoticeHours: number;
  maxBookingDays: number;
  slotDurationMinutes: number;
  allowedChannels: string[];
  officeAddress?: string | null;
  autoConfirm: boolean;
  blockedDates: string[];
  channelInstructions: Record<string, string>;
}

interface ProviderIntegration {
  id: string;
  providerName: string;
  status: 'connected' | 'disconnected' | 'error';
  accountEmail: string | null;
  syncCalendarConflicts: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
}

const DAYS_ORDER: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function AppointmentSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [settings, setSettings] = useState<AppointmentSettings | null>(null);
  const [integrations, setIntegrations] = useState<ProviderIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load settings & integrations
  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/appointments/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
          setIntegrations(data.integrations || []);
        }
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setFeedback({ type: 'error', message: 'Could not load appointment settings from server.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Handle Google OAuth callback code in URL query
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setFeedback({ type: 'error', message: `Google authorization was cancelled or denied: ${oauthError}` });
      router.replace('/admin/appointments/settings');
      return;
    }

    if (code) {
      const exchangeCode = async () => {
        setConnectingGoogle(true);
        try {
          const res = await fetch('/api/admin/integrations/google/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, state }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            setFeedback({
              type: 'success',
              message: `Google Workspace connected successfully (${data.accountEmail}). Real Google Meet conferencing is active.`,
            });
            loadSettings();
            // Clean URL query
            router.replace('/admin/appointments/settings');
          } else {
            throw new Error(data.error || 'Failed to exchange Google OAuth code.');
          }
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Google authorization failed.' });
        } finally {
          setConnectingGoogle(false);
        }
      };

      exchangeCode();
    }
  }, [searchParams, router]);

  // Handle Google Connect button
  const handleConnectGoogle = async () => {
    try {
      setConnectingGoogle(true);
      const res = await fetch('/api/admin/integrations/google/auth-url');
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to initialize Google OAuth connection.');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
      setConnectingGoogle(false);
    }
  };

  // Handle Google Disconnect
  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Calendar & Google Meet? Automated video meeting generation will be paused.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/integrations/google/disconnect', { method: 'POST' });
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Google Meet integration disconnected.' });
        loadSettings();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to disconnect Google Meet.' });
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      const res = await fetch('/api/admin/appointments/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setFeedback({ type: 'success', message: 'Appointment schedule and availability settings saved successfully.' });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        throw new Error(data.error || 'Failed to update settings.');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const googleIntegration = integrations.find((i) => i.providerName === 'google_meet');
  const isGoogleConnected = googleIntegration?.status === 'connected';

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400 text-xs">
        <RefreshCw className="w-5 h-5 text-[#49056B] animate-spin" />
        <span>Loading consultation settings...</span>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/appointments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-[#49056B] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Appointments</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Appointment & Availability Settings
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure Ottawa working hours, buffers, booking channels, and video meeting integrations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/book"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200/80 bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 text-xs font-semibold shadow-2xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            <span>Preview /book</span>
          </Link>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#49056B] text-white hover:bg-[#390044] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-md border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Ottawa Business Working Hours */}
        <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#49056B]" />
                <span>Working Days & Available Hours</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Times operate in Ottawa local time (<span className="font-medium text-zinc-700">America/Toronto</span>, EST/EDT). Customers booking from other regions see their local equivalent.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-zinc-500 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">
              America/Toronto
            </span>
          </div>

          <div className="space-y-2.5 pt-2">
            {DAYS_ORDER.map(({ key, label }) => {
              const day = settings.workingDays[key] || { enabled: false, start: '08:00', end: '18:00' };

              return (
                <div
                  key={key}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                    day.enabled
                      ? 'bg-white border-zinc-200/90'
                      : 'bg-zinc-50/70 border-zinc-200/60 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`day-${key}`}
                      checked={day.enabled}
                      onChange={(e) => {
                        const updated = {
                          ...settings.workingDays,
                          [key]: { ...day, enabled: e.target.checked },
                        };
                        setSettings({ ...settings, workingDays: updated });
                      }}
                      className="w-4 h-4 rounded text-[#49056B] focus:ring-[#49056B] border-zinc-300 cursor-pointer"
                    />
                    <label
                      htmlFor={`day-${key}`}
                      className="text-xs font-semibold text-zinc-900 w-28 cursor-pointer select-none"
                    >
                      {label}
                    </label>
                  </div>

                  {day.enabled ? (
                    <div className="flex items-center gap-2 self-start sm:self-auto pl-7 sm:pl-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-zinc-500 font-medium">Open:</span>
                        <input
                          type="time"
                          value={day.start}
                          onChange={(e) => {
                            const updated = {
                              ...settings.workingDays,
                              [key]: { ...day, start: e.target.value },
                            };
                            setSettings({ ...settings, workingDays: updated });
                          }}
                          className="px-2 py-1 text-xs bg-zinc-50 border border-zinc-200 rounded font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#49056B]"
                        />
                      </div>
                      <span className="text-zinc-400 text-xs">—</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-zinc-500 font-medium">Close:</span>
                        <input
                          type="time"
                          value={day.end}
                          onChange={(e) => {
                            const updated = {
                              ...settings.workingDays,
                              [key]: { ...day, end: e.target.value },
                            };
                            setSettings({ ...settings, workingDays: updated });
                          }}
                          className="px-2 py-1 text-xs bg-zinc-50 border border-zinc-200 rounded font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#49056B]"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 italic pl-7 sm:pl-0">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Scheduling Rules & Buffer Policy */}
        <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#49056B]" />
              <span>Consultation Timing & Buffer Rules</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Prevent back-to-back overlaps and establish preparation windows for moving and cleaning dispatchers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Consultation Duration
              </label>
              <select
                value={settings.slotDurationMinutes}
                onChange={(e) => setSettings({ ...settings, slotDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#49056B]"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes (Standard)</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Buffer Between Meetings
              </label>
              <select
                value={settings.bufferMinutes}
                onChange={(e) => setSettings({ ...settings, bufferMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#49056B]"
              >
                <option value={0}>No buffer</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes (Recommended)</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Minimum Notice Required
              </label>
              <select
                value={settings.minNoticeHours}
                onChange={(e) => setSettings({ ...settings, minNoticeHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#49056B]"
              >
                <option value={1}>1 hour in advance</option>
                <option value={2}>2 hours in advance (Standard)</option>
                <option value={4}>4 hours in advance</option>
                <option value={24}>24 hours in advance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Booking Horizon
              </label>
              <select
                value={settings.maxBookingDays}
                onChange={(e) => setSettings({ ...settings, maxBookingDays: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#49056B]"
              >
                <option value={14}>14 days ahead</option>
                <option value={30}>30 days ahead (Standard)</option>
                <option value={60}>60 days ahead</option>
                <option value={90}>90 days ahead</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Enabled Consultation Formats */}
        <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#49056B]" />
              <span>Enabled Consultation Formats</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Select which channels are presented to prospective clients on the public self-service booking page.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {[
              { id: 'telephone', label: 'Telephone Consultation', icon: Phone, desc: 'Coordinator calls customer' },
              { id: 'on_site', label: 'On-Site Property Assessment', icon: MapPin, desc: 'Coordinator visits Ottawa address' },
              { id: 'in_person', label: 'In-Person Consultation', icon: Building, desc: 'Customer visits office' },
              { id: 'google_meet', label: 'Google Meet (Video)', icon: Video, desc: 'Automated video meeting' },
            ].map((ch) => {
              const Icon = ch.icon;
              const isChecked = settings.allowedChannels.includes(ch.id);

              return (
                <label
                  key={ch.id}
                  className={`p-3.5 rounded-lg border flex flex-col justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-purple-50/40 border-[#49056B]/30 shadow-2xs'
                      : 'bg-zinc-50/50 border-zinc-200/80 text-zinc-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <Icon className={`w-4 h-4 ${isChecked ? 'text-[#49056B]' : 'text-zinc-400'}`} />
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...settings.allowedChannels, ch.id]
                          : settings.allowedChannels.filter((c) => c !== ch.id);
                        setSettings({ ...settings, allowedChannels: updated });
                      }}
                      className="w-4 h-4 rounded text-[#49056B] focus:ring-[#49056B] border-zinc-300"
                    />
                  </div>
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-zinc-900">{ch.label}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{ch.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Verified Office Address Setting */}
          <div className="mt-4 p-4 rounded-lg bg-zinc-50 border border-zinc-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#49056B]" />
                <span className="text-xs font-bold text-zinc-900">Verified Office Location for In-Person Consultations</span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                  Boolean(settings.officeAddress && settings.officeAddress.trim().length >= 10)
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {Boolean(settings.officeAddress && settings.officeAddress.trim().length >= 10)
                  ? 'Location Verified & Active'
                  : 'Unconfigured — Office Consultations Disabled'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Laurrel Services operates without walk-in appointments unless an approved business premises address is recorded below.
              When left blank or under 10 characters, in-person office bookings are strictly blocked on the public booking portal to protect customers.
              (Note: On-site property assessments are unaffected and use the customer&apos;s Ottawa address).
            </p>

            <div>
              <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                Official Business Meeting Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.officeAddress || ''}
                  onChange={(e) => setSettings({ ...settings, officeAddress: e.target.value })}
                  placeholder="e.g., 150 Elgin Street, Suite 800, Ottawa, ON K2P 1L4"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#49056B] transition-all"
                />
                <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Video Conferencing Provider Integrations */}
        <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-[#49056B]" />
              <span>Video Meeting Integrations</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Connect external calendar accounts to automatically generate real meeting links and detect calendar conflicts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* 1. Google Meet & Calendar */}
            <div className="p-4 rounded-xl border border-zinc-200/90 bg-zinc-50/50 space-y-3.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-zinc-900 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Google Workspace</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      isGoogleConnected
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-500'
                    }`}
                  >
                    {isGoogleConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Generates genuine Google Meet links (<span className="font-mono text-[10px]">meet.google.com</span>) via Google Calendar API with FreeBusy synchronization.
                </p>
                {googleIntegration?.accountEmail && (
                  <div className="text-[11px] text-zinc-700 font-medium bg-white p-2 rounded border border-zinc-200/70 truncate">
                    Account: {googleIntegration.accountEmail}
                  </div>
                )}
                {googleIntegration?.lastError && (
                  <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {googleIntegration.lastError}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-200/60">
                {isGoogleConnected ? (
                  <button
                    type="button"
                    onClick={handleDisconnectGoogle}
                    className="w-full px-3 py-1.5 rounded-md bg-white border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disconnect Google</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    disabled={connectingGoogle}
                    className="w-full px-3 py-1.5 rounded-md bg-[#49056B] text-white hover:bg-[#390044] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    {connectingGoogle ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Video className="w-3.5 h-3.5" />
                    )}
                    <span>{connectingGoogle ? 'Connecting...' : 'Connect Google Workspace'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. Microsoft Teams */}
            <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-3.5 flex flex-col justify-between opacity-80">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-zinc-900 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Microsoft Teams</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 border border-zinc-200 text-zinc-500">
                    In Development
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Microsoft Graph API integration for enterprise Microsoft 365 tenants.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-200/60">
                <button
                  type="button"
                  disabled
                  className="w-full px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-400 text-xs font-semibold cursor-not-allowed text-center"
                >
                  Graph API Adapter Pending
                </button>
              </div>
            </div>

            {/* 3. Zoom */}
            <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-3.5 flex flex-col justify-between opacity-80">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-zinc-900 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span>Zoom Meetings</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 border border-zinc-200 text-zinc-500">
                    In Development
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Server-to-Server OAuth integration for corporate Zoom accounts.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-200/60">
                <button
                  type="button"
                  disabled
                  className="w-full px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-400 text-xs font-semibold cursor-not-allowed text-center"
                >
                  Server OAuth Adapter Pending
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/appointments"
            className="px-4 py-2 rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-md bg-[#49056B] text-white hover:bg-[#390044] text-xs font-semibold shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
