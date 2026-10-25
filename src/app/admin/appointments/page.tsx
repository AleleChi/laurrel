'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  MapPin,
  Video,
  User,
  Search,
  RefreshCw,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  CalendarDays,
  Send,
  AlertCircle,
  FileText,
  CalendarPlus,
  FilterX,
  Settings,
} from 'lucide-react';
import {
  formatOttawaDate,
  formatOttawaTime,
  formatOttawaDateTime,
  formatOttawaTimeRange,
  formatAppointmentType,
  formatAppointmentStatus,
  formatCanadianDate,
  formatCanadianDateTime,
} from '@/lib/utils/formatters';
import ScheduleMeetingModal from '@/components/admin/ScheduleMeetingModal';

interface AppointmentItem {
  id: string;
  enquiryId: string;
  title: string;
  purpose?: string | null;
  appointmentType: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  durationMinutes: number;
  timezone: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  locationOrLink?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  staffNotes?: string | null;
  notificationSent: boolean;
  notificationSentAt?: string | null;
  cancellationReason?: string | null;
  conferenceStatus?: string | null;
  googleSyncStatus?: string | null;
  googleSyncError?: string | null;
  calendarEventId?: string | null;
  createdAt: string;
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'agenda' | 'week' | 'day'>('agenda');

  // Selected date navigation for day/week views
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Detail Drawer & Modals
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
  const [appointmentActivity, setAppointmentActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState<boolean>(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [retryingSync, setRetryingSync] = useState<boolean>(false);
  const [reconcilingConf, setReconcilingConf] = useState<boolean>(false);

  const handleRetryGoogleSync = async (aptId: string) => {
    try {
      setRetryingSync(true);
      const res = await fetch(`/api/admin/appointments/${aptId}/retry-google-sync`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMessage('Google Calendar event resynced successfully.');
        if (data.appointment) {
          setSelectedAppointment(data.appointment);
          setAppointments((prev) => prev.map((a) => (a.id === aptId ? data.appointment : a)));
        }
      } else {
        setFeedbackMessage(data.error || 'Retry sync failed.');
      }
    } catch {
      setFeedbackMessage('Network failure during retry sync.');
    } finally {
      setRetryingSync(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handleReconcileConference = async (aptId: string) => {
    try {
      setReconcilingConf(true);
      const res = await fetch(`/api/admin/appointments/${aptId}/reconcile-conference`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMessage(data.reconciled ? 'Video link verified and updated.' : 'Conference is still pending creation.');
        if (data.appointment) {
          setSelectedAppointment(data.appointment);
          setAppointments((prev) => prev.map((a) => (a.id === aptId ? data.appointment : a)));
        }
      } else {
        setFeedbackMessage(data.error || 'Conference reconciliation check failed.');
      }
    } catch {
      setFeedbackMessage('Network failure during conference reconciliation.');
    } finally {
      setReconcilingConf(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [aptRes, staffRes] = await Promise.all([
        fetch('/api/admin/appointments?limit=300', { cache: 'no-store' }),
        fetch('/api/admin/staff', { cache: 'no-store' }),
      ]);

      if (aptRes.ok) {
        const data = await aptRes.json();
        setAppointments(data.appointments || []);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaffList(staffData.staff || []);
      }
    } catch (err) {
      console.error('[Appointments Load Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selected appointment changes, load activity timeline
  useEffect(() => {
    if (!selectedAppointment) {
      setAppointmentActivity([]);
      return;
    }

    setLoadingActivity(true);
    fetch(`/api/admin/appointments/${selectedAppointment.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.activity) {
          setAppointmentActivity(data.activity);
        }
      })
      .catch((err) => console.error('Failed to load activity:', err))
      .finally(() => setLoadingActivity(false));
  }, [selectedAppointment?.id]);

  // Actions
  const handleStatusUpdate = async (aptId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/appointments/${aptId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments((prev) =>
          prev.map((a) => (a.id === aptId ? data.appointment : a))
        );
        if (selectedAppointment?.id === aptId) {
          setSelectedAppointment(data.appointment);
        }
        setFeedbackMessage(`Consultation status updated to ${newStatus}.`);
        setTimeout(() => setFeedbackMessage(null), 3500);
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleResendInvite = async (aptId: string) => {
    try {
      setFeedbackMessage('Sending invitation email...');
      const res = await fetch(`/api/admin/appointments/${aptId}/resend-invite`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage('Notification email sent successfully.');
      } else {
        setFeedbackMessage(`Email notice: ${data.error || 'Service unconfigured'}`);
      }
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage(`Failed to resend invite: ${err.message}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handleCancelAppointment = async (aptId: string) => {
    const reason = window.prompt('Please provide a reason for cancelling this appointment:');
    if (!reason || !reason.trim()) return;

    try {
      const res = await fetch(`/api/admin/appointments/${aptId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim(), notifyCustomer: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments((prev) =>
          prev.map((a) => (a.id === aptId ? data.appointment : a))
        );
        if (selectedAppointment?.id === aptId) {
          setSelectedAppointment(data.appointment);
        }
        setFeedbackMessage('Consultation cancelled successfully.');
        setTimeout(() => setFeedbackMessage(null), 3500);
      }
    } catch (err) {
      console.error('Cancellation failed:', err);
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
    if (staffFilter !== 'all' && apt.assignedStaffId !== staffFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = apt.customerName.toLowerCase().includes(q);
      const matchEmail = apt.customerEmail.toLowerCase().includes(q);
      const matchPhone = apt.customerPhone?.toLowerCase().includes(q);
      const matchTitle = apt.title.toLowerCase().includes(q);
      const matchEnquiry = apt.enquiryId.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchTitle || matchEnquiry;
    }

    return true;
  });

  // Group agenda by local date (Ottawa)
  const groupedAgenda: Record<string, AppointmentItem[]> = {};
  filteredAppointments.forEach((apt) => {
    const dateKey = formatOttawaDate(apt.scheduledStart);
    if (!groupedAgenda[dateKey]) {
      groupedAgenda[dateKey] = [];
    }
    groupedAgenda[dateKey].push(apt);
  });

  const renderStatus = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            Pending
          </span>
        );
      case 'rescheduled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-[#390044] border border-purple-200/60">
            Rescheduled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-600 border border-red-200/60">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-600 capitalize">
            {status}
          </span>
        );
    }
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setStaffFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Appointments & Consultations
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Coordinate customer moving, cleaning, and storage consultations in Ottawa local time.
          </p>
        </div>

        {/* View Switcher & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-md bg-zinc-200/70 p-1 border border-zinc-200/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Agenda
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded transition-all ${
                viewMode === 'day'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Day
            </button>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-md border border-zinc-200/80 bg-white text-zinc-600 hover:bg-zinc-50 transition-colors shadow-2xs"
            title="Refresh appointments"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#390044]' : ''}`} />
          </button>

          <Link
            href="/admin/appointments/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200/80 bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 text-xs font-semibold shadow-2xs transition-colors"
            title="Configure Ottawa schedule and availability rules"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-500" />
            <span>Settings</span>
          </Link>

          <Link
            href="/book"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#390044] text-white hover:bg-[#390044] text-xs font-semibold shadow-2xs transition-colors"
            title="Open customer-facing self-service booking page"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Booking</span>
          </Link>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 rounded-md bg-purple-50 border border-purple-200 text-xs text-[#390044] flex items-center justify-between">
          <span>{feedbackMessage}</span>
          <button type="button" onClick={() => setFeedbackMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Unified Filter Toolbar */}
      <div className="bg-white rounded-md p-3 border border-zinc-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, email, phone, or title..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#390044] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#390044]"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#390044]"
            >
              <option value="all">All Coordinators</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {(statusFilter !== 'all' || staffFilter !== 'all' || searchQuery.trim()) && (
              <button
                onClick={resetFilters}
                title="Reset filters"
                className="px-2.5 py-2 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-medium inline-flex items-center gap-1 transition-colors"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content View */}
      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-400 bg-white rounded-md border border-zinc-200/80">
          <div className="flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#390044] animate-spin" />
            <span>Loading appointments schedule...</span>
          </div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-md border border-zinc-200/80 p-6 space-y-2">
          <CalendarDays className="w-8 h-8 text-zinc-300 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-800">No consultations found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || staffFilter !== 'all'
              ? 'No scheduled consultations match your current filter parameters.'
              : 'Consultations booked from customer enquiries will appear on this calendar.'}
          </p>
          {(statusFilter !== 'all' || staffFilter !== 'all' || searchQuery.trim()) && (
            <button
              onClick={resetFilters}
              className="mt-2 text-xs font-semibold text-[#390044] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : viewMode === 'agenda' ? (
        /* Agenda View */
        <div className="space-y-4">
          {Object.entries(groupedAgenda).map(([dateLabel, dateAppointments]) => (
            <div
              key={dateLabel}
              className="bg-white rounded-md border border-zinc-200/80 shadow-2xs overflow-hidden"
            >
              <div className="px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-200/80 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 tracking-tight">
                  {dateLabel}
                </span>
                <span className="text-[11px] font-medium text-zinc-500">
                  {dateAppointments.length} consultation{dateAppointments.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="divide-y divide-zinc-100">
                {dateAppointments.map((apt) => {
                  const isJoinableUrl =
                    apt.locationOrLink &&
                    (apt.locationOrLink.startsWith('http://') || apt.locationOrLink.startsWith('https://'));
                  return (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className="p-4 hover:bg-zinc-50/60 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-sm text-zinc-900 truncate">
                            {apt.title}
                          </span>
                          {renderStatus(apt.status)}
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                            {formatAppointmentType(apt.appointmentType)}
                          </span>
                          {apt.googleSyncStatus === 'failed' && (
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              Sync Error
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600">
                          <div className="inline-flex items-center gap-1.5 font-medium text-zinc-800">
                            <Clock className="w-3.5 h-3.5 text-[#390044]" />
                            <span>
                              {formatOttawaTime(apt.scheduledStart)} – {formatOttawaTime(apt.scheduledEnd)}
                            </span>
                            <span className="text-zinc-400 font-normal">({apt.durationMinutes}m)</span>
                          </div>

                          <div className="inline-flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{apt.customerName}</span>
                          </div>

                          {apt.assignedStaffName && (
                            <div className="inline-flex items-center gap-1.5 text-zinc-500">
                              <span>Staff: {apt.assignedStaffName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isJoinableUrl ? (
                          <a
                            href={apt.locationOrLink!}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#390044] hover:underline"
                          >
                            <span>Meeting Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : apt.locationOrLink ? (
                          <span className="text-xs text-zinc-500 max-w-xs truncate">
                            {apt.locationOrLink}
                          </span>
                        ) : null}

                        <span className="px-2.5 py-1 rounded bg-zinc-50 group-hover:bg-zinc-100 text-xs font-semibold text-zinc-700 border border-zinc-200 transition-colors">
                          Manage
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Day or Week View */
        <div className="bg-white rounded-md border border-zinc-200/80 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - (viewMode === 'week' ? 7 : 1));
                  setSelectedDate(d);
                }}
                className="p-1 rounded-md hover:bg-zinc-100 text-zinc-600 transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-zinc-900">
                {formatOttawaDate(selectedDate)}
              </span>
              <button
                type="button"
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + (viewMode === 'week' ? 7 : 1));
                  setSelectedDate(d);
                }}
                className="p-1 rounded-md hover:bg-zinc-100 text-zinc-600 transition-colors"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(new Date())}
              className="text-xs font-semibold text-[#390044] hover:underline"
            >
              Today
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {filteredAppointments
              .filter((apt) => {
                const aptDate = new Date(apt.scheduledStart);
                return (
                  aptDate.getFullYear() === selectedDate.getFullYear() &&
                  aptDate.getMonth() === selectedDate.getMonth() &&
                  aptDate.getDate() === selectedDate.getDate()
                );
              })
              .map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => setSelectedAppointment(apt)}
                  className="p-3.5 rounded-md border border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-100/70 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-zinc-900">{apt.title}</div>
                    <div className="text-[11px] text-zinc-500">
                      {formatOttawaTime(apt.scheduledStart)} – {formatOttawaTime(apt.scheduledEnd)} • {apt.customerName}
                    </div>
                  </div>
                  {renderStatus(apt.status)}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Appointment Detail Slide-Over Drawer */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-2xs">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l border-zinc-200 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/60">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-900">
                    {selectedAppointment.title}
                  </h3>
                  {renderStatus(selectedAppointment.status)}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Ref: <span className="font-mono">{selectedAppointment.id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs">
              {/* Timing & Format */}
              <div className="p-3.5 rounded-md bg-zinc-50 border border-zinc-200/70 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Scheduled Consultation Window (Ottawa Time)
                </div>
                <div className="text-sm font-semibold text-zinc-900">
                  {formatOttawaDate(selectedAppointment.scheduledStart)}
                </div>
                <div className="text-xs text-zinc-600">
                  {formatOttawaTimeRange(selectedAppointment.scheduledStart, selectedAppointment.scheduledEnd)} ({selectedAppointment.durationMinutes} min)
                </div>
                <div className="text-[11px] text-zinc-500">
                  Format: <span className="font-medium text-zinc-700 capitalize">{formatAppointmentType(selectedAppointment.appointmentType)}</span>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="space-y-2 pb-4 border-b border-zinc-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Customer Contact
                </div>
                <div className="text-sm font-semibold text-zinc-900">
                  {selectedAppointment.customerName}
                </div>
                <div className="text-xs text-zinc-600 flex items-center gap-2">
                  <span className="font-medium">{selectedAppointment.customerEmail}</span>
                  {selectedAppointment.customerPhone && (
                    <span>• {selectedAppointment.customerPhone}</span>
                  )}
                </div>
              </div>

              {/* Assigned Coordinator */}
              <div className="space-y-1 pb-4 border-b border-zinc-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Assigned Staff Coordinator
                </div>
                <div className="text-xs font-semibold text-zinc-800">
                  {selectedAppointment.assignedStaffName || 'Unassigned / Team Pool'}
                </div>
              </div>

              {/* Location or Meeting URL */}
              {selectedAppointment.locationOrLink && (
                <div className="space-y-1 pb-4 border-b border-zinc-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Location / Meeting URL
                  </div>
                  {selectedAppointment.locationOrLink.startsWith('http') ? (
                    <a
                      href={selectedAppointment.locationOrLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-[#390044] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{selectedAppointment.locationOrLink}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <div className="text-xs text-zinc-700">
                      {selectedAppointment.locationOrLink}
                    </div>
                  )}
                </div>
              )}

              {/* Google Calendar Synchronization & Video Reconciliation */}
              {(selectedAppointment.googleSyncStatus || selectedAppointment.calendarEventId || selectedAppointment.appointmentType === 'google_meet') && (
                <div className="space-y-2 pb-4 border-b border-zinc-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Google Calendar & Video Sync
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedAppointment.googleSyncStatus === 'synced' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Google Calendar Synced
                      </span>
                    ) : selectedAppointment.googleSyncStatus === 'failed' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Google Sync Error
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                        Sync: {selectedAppointment.googleSyncStatus || 'not_applicable'}
                      </span>
                    )}

                    {selectedAppointment.conferenceStatus === 'pending_details' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <Video className="w-3.5 h-3.5 text-amber-600" />
                        Video Link Pending
                      </span>
                    )}
                  </div>

                  {selectedAppointment.googleSyncError && (
                    <div className="p-2 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
                      <span className="font-semibold">Sync Error: </span>
                      <span>{selectedAppointment.googleSyncError}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {selectedAppointment.googleSyncStatus === 'failed' && (
                      <button
                        type="button"
                        onClick={() => handleRetryGoogleSync(selectedAppointment.id)}
                        disabled={retryingSync}
                        className="px-2.5 py-1 rounded bg-[#390044] text-white text-xs font-semibold hover:bg-[#4d035b] transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${retryingSync ? 'animate-spin' : ''}`} />
                        <span>Retry Google Calendar Sync</span>
                      </button>
                    )}

                    {selectedAppointment.appointmentType === 'google_meet' && selectedAppointment.conferenceStatus === 'pending_details' && (
                      <button
                        type="button"
                        onClick={() => handleReconcileConference(selectedAppointment.id)}
                        disabled={reconcilingConf}
                        className="px-2.5 py-1 rounded bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${reconcilingConf ? 'animate-spin' : ''}`} />
                        <span>Reconcile Video Link</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Appointment Actions
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedAppointment.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selectedAppointment.id, 'confirmed')}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors"
                    >
                      Confirm Appointment
                    </button>
                  )}
                  {selectedAppointment.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selectedAppointment.id, 'completed')}
                      className="px-3 py-1.5 rounded-md bg-zinc-800 text-white font-semibold text-xs hover:bg-zinc-900 transition-colors"
                    >
                      Mark Completed
                    </button>
                  )}
                  {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsRescheduleOpen(true)}
                        className="px-3 py-1.5 rounded-md bg-purple-50 text-[#390044] font-semibold text-xs hover:bg-purple-100 transition-colors"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelAppointment(selectedAppointment.id)}
                        className="px-3 py-1.5 rounded-md bg-red-50 text-red-700 font-semibold text-xs hover:bg-red-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleResendInvite(selectedAppointment.id)}
                    className="px-3 py-1.5 rounded-md border border-zinc-200 text-zinc-700 font-medium text-xs hover:bg-zinc-50 transition-colors ml-auto"
                  >
                    Resend Invite Email
                  </button>
                </div>
              </div>

              {/* Activity History Audit Log */}
              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Appointment Activity & Audit History
                </div>
                {loadingActivity ? (
                  <div className="py-2 text-zinc-400 text-center">Loading audit history...</div>
                ) : appointmentActivity.length === 0 ? (
                  <div className="text-zinc-400 text-center py-2">No activity recorded.</div>
                ) : (
                  <div className="space-y-2">
                    {appointmentActivity.map((act) => (
                      <div
                        key={act.id}
                        className="p-2.5 rounded-md bg-zinc-50 border border-zinc-200/60 space-y-0.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-zinc-800 capitalize">
                            {act.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-zinc-400">
                            {formatCanadianDateTime(act.createdAt)}
                          </span>
                        </div>
                        {act.details && (
                          <p className="text-zinc-600 text-[11px]">{act.details}</p>
                        )}
                        <p className="text-[10px] text-zinc-400">By: {act.performedBy}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {selectedAppointment && (
        <ScheduleMeetingModal
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          onScheduled={(updated) => {
            setAppointments((prev) =>
              prev.map((a) => (a.id === updated.id ? updated : a))
            );
            setSelectedAppointment(updated);
            setFeedbackMessage('Consultation rescheduled successfully.');
            setTimeout(() => setFeedbackMessage(null), 3500);
          }}
          enquiry={{
            id: selectedAppointment.enquiryId,
            customer: {
              name: selectedAppointment.customerName,
              email: selectedAppointment.customerEmail,
              phone: selectedAppointment.customerPhone || undefined,
            },
            services: [],
            serviceLocation: selectedAppointment.locationOrLink || undefined,
          }}
          rescheduleAppointmentId={selectedAppointment.id}
          initialAppointment={selectedAppointment}
        />
      )}
    </div>
  );
}
