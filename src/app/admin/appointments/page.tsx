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
        setSelectedAppointment(data.appointment);
        setFeedbackMessage(`Status updated to ${newStatus}.`);
        setTimeout(() => setFeedbackMessage(null), 3500);
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleCancel = async (aptId: string) => {
    const reason = window.prompt('Please enter a cancellation reason:');
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
        setSelectedAppointment(data.appointment);
        setFeedbackMessage('Consultation cancelled.');
        setTimeout(() => setFeedbackMessage(null), 3500);
      }
    } catch (err) {
      console.error('Cancel failed:', err);
    }
  };

  const handleResendInvite = async (aptId: string) => {
    try {
      setFeedbackMessage('Dispatching invitation email...');
      const res = await fetch(`/api/admin/appointments/${aptId}/resend-invite`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage('Invitation email sent successfully.');
      } else {
        setFeedbackMessage(`Email notice: ${data.error || 'Check service'}`);
      }
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage(`Error: ${err.message}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Appointments & Consultations
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review, schedule, and coordinate customer consultations in Ottawa local time.
          </p>
        </div>

        {/* View Switcher & Refresh */}
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 border border-black/[0.06] text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-md transition-all ${
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
              className={`px-3 py-1.5 rounded-md transition-all ${
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
              className={`px-3 py-1.5 rounded-md transition-all ${
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
            className="p-2 rounded-lg border border-black/[0.1] bg-white text-zinc-600 hover:bg-zinc-50 transition-colors shadow-2xs"
            title="Refresh appointments"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-[#49056B] flex items-center justify-between">
          <span>{feedbackMessage}</span>
          <button type="button" onClick={() => setFeedbackMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, phone, or title..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-black/[0.08] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] shadow-2xs transition-all"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-white rounded-xl border border-black/[0.08] text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 shadow-2xs"
        >
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="rescheduled">Rescheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Staff Filter */}
        <select
          value={staffFilter}
          onChange={(e) => setStaffFilter(e.target.value)}
          className="px-3.5 py-2 bg-white rounded-xl border border-black/[0.08] text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 shadow-2xs"
        >
          <option value="all">All Coordinators</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content View */}
      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-400 bg-white rounded-xl border border-black/[0.06]">
          Loading consultations and calendar data...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-black/[0.06] p-6 space-y-3">
          <CalendarDays className="w-10 h-10 text-zinc-300 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-800">No consultations match your criteria</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Try adjusting your search query, status filters, or schedule a new consultation from an inbound customer enquiry.
          </p>
          <Link
            href="/admin/enquiries"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#49056B] text-white text-xs font-semibold hover:bg-[#5B0785] transition-all shadow-2xs mt-2"
          >
            <span>View Customer Enquiries</span>
          </Link>
        </div>
      ) : viewMode === 'agenda' ? (
        /* Agenda View */
        <div className="space-y-6">
          {Object.entries(groupedAgenda).map(([dateLabel, aptList]) => (
            <div key={dateLabel} className="space-y-3">
              <div className="sticky top-16 z-10 bg-[#F8F7F4]/90 backdrop-blur-xs py-1.5 flex items-center justify-between border-b border-black/[0.06]">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  {dateLabel}
                </h3>
                <span className="text-[11px] text-zinc-400 font-medium">
                  {aptList.length} {aptList.length === 1 ? 'consultation' : 'consultations'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {aptList.map((apt) => {
                  const statusBadge = formatAppointmentStatus(apt.status);
                  const isJoinableUrl = apt.locationOrLink && /^https?:\/\//i.test(apt.locationOrLink);

                  return (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className="p-4 rounded-xl bg-white border border-black/[0.06] hover:border-[#49056B]/30 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${statusBadge.color} ${statusBadge.bg}`}
                          >
                            {statusBadge.label}
                          </span>
                          <span className="text-xs font-bold text-zinc-900 truncate">{apt.title}</span>
                          <span className="text-[11px] text-zinc-400">
                            {formatAppointmentType(apt.appointmentType)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600">
                          <div className="inline-flex items-center gap-1.5 font-medium text-zinc-800">
                            <Clock className="w-3.5 h-3.5 text-[#49056B]" />
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
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#49056B] hover:underline"
                          >
                            <span>Meeting Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : apt.locationOrLink ? (
                          <span className="text-xs text-zinc-500 max-w-xs truncate">
                            {apt.locationOrLink}
                          </span>
                        ) : null}

                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-xs font-medium text-zinc-700 border border-black/[0.08] transition-colors"
                        >
                          Manage
                        </button>
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
        <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - (viewMode === 'week' ? 7 : 1));
                  setSelectedDate(d);
                }}
                className="p-1 rounded-md hover:bg-zinc-100 text-zinc-600"
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
                className="p-1 rounded-md hover:bg-zinc-100 text-zinc-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(new Date())}
              className="text-xs font-medium text-[#49056B] hover:underline"
            >
              Today
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
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
                  className="p-3.5 rounded-lg border border-black/[0.08] bg-zinc-50 hover:bg-zinc-100/80 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-zinc-900">{apt.title}</div>
                    <div className="text-[11px] text-zinc-500">
                      {formatOttawaTime(apt.scheduledStart)} – {formatOttawaTime(apt.scheduledEnd)} · {apt.customerName}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${formatAppointmentStatus(apt.status).color} ${formatAppointmentStatus(apt.status).bg}`}
                  >
                    {apt.status}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Appointment Detail Drawer */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-black/[0.08] overflow-y-auto">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${formatAppointmentStatus(selectedAppointment.status).color} ${formatAppointmentStatus(selectedAppointment.status).bg}`}
                  >
                    {formatAppointmentStatus(selectedAppointment.status).label}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">{selectedAppointment.id}</span>
                </div>
                <h2 className="text-base font-bold text-zinc-900 mt-1">{selectedAppointment.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Timing & Schedule */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-black/[0.06] space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Scheduled Time (Ottawa Local)
                </div>
                <div className="text-sm font-bold text-zinc-900">
                  {formatOttawaTimeRange(
                    selectedAppointment.scheduledStart,
                    selectedAppointment.scheduledEnd
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  Duration: {selectedAppointment.durationMinutes} minutes · {formatAppointmentType(selectedAppointment.appointmentType)}
                </div>
              </div>

              {/* Customer Contact */}
              <div className="space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Customer Information
                </div>
                <div className="p-4 rounded-xl bg-white border border-black/[0.06] space-y-2">
                  <div className="font-semibold text-zinc-900 text-sm">{selectedAppointment.customerName}</div>
                  <div className="text-xs text-zinc-600 flex items-center gap-2">
                    <span className="text-zinc-400">Email:</span>
                    <span>{selectedAppointment.customerEmail}</span>
                  </div>
                  {selectedAppointment.customerPhone && (
                    <div className="text-xs text-zinc-600 flex items-center gap-2">
                      <span className="text-zinc-400">Phone:</span>
                      <span>{selectedAppointment.customerPhone}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-black/[0.04] text-xs">
                    <Link
                      href={`/admin/enquiries?id=${selectedAppointment.enquiryId}`}
                      className="text-[#49056B] hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <span>View Linked Enquiry ({selectedAppointment.enquiryId})</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Meeting Location / Video Link */}
              <div className="space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Format & Connection
                </div>
                <div className="p-4 rounded-xl bg-white border border-black/[0.06] text-xs text-zinc-800 space-y-1">
                  <div className="font-semibold">{formatAppointmentType(selectedAppointment.appointmentType)}</div>
                  {selectedAppointment.locationOrLink ? (
                    <div className="break-all pt-1">
                      {/^https?:\/\//i.test(selectedAppointment.locationOrLink) ? (
                        <a
                          href={selectedAppointment.locationOrLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#49056B] hover:underline font-semibold inline-flex items-center gap-1"
                        >
                          <span>Open Video Meeting</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span>{selectedAppointment.locationOrLink}</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-zinc-400 italic">No location or link recorded.</div>
                  )}
                </div>
              </div>

              {/* Coordinator */}
              <div className="space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Assigned Team Member
                </div>
                <div className="p-4 rounded-xl bg-white border border-black/[0.06] text-xs text-zinc-800">
                  {selectedAppointment.assignedStaffName || 'Unassigned / Team Dispatch'}
                </div>
              </div>

              {/* Private Staff Notes */}
              {selectedAppointment.staffNotes && (
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Private Staff Notes
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-black/[0.06] text-xs text-zinc-700 whitespace-pre-wrap">
                    {selectedAppointment.staffNotes}
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Audit & Activity Log
                </div>
                {loadingActivity ? (
                  <div className="text-xs text-zinc-400 py-2">Loading activity...</div>
                ) : appointmentActivity.length > 0 ? (
                  <div className="space-y-2.5">
                    {appointmentActivity.map((act) => (
                      <div key={act.id} className="text-xs p-2.5 rounded-lg bg-zinc-50 border border-black/[0.04]">
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-0.5">
                          <span className="font-semibold text-zinc-800">{act.performedBy}</span>
                          <span>{formatCanadianDateTime(act.createdAt)}</span>
                        </div>
                        <p className="text-zinc-700">{act.details || act.action}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-zinc-400 py-2">No activity recorded yet.</div>
                )}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="p-6 border-t border-black/[0.06] bg-zinc-50/50 space-y-2 sticky bottom-0">
              <div className="flex flex-wrap gap-2">
                {selectedAppointment.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedAppointment.id, 'confirmed')}
                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors"
                  >
                    Confirm Consultation
                  </button>
                )}
                {selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRescheduleOpen(true)}
                      className="py-2 px-3 rounded-lg border border-black/[0.1] bg-white text-zinc-700 hover:bg-zinc-100 text-xs font-semibold shadow-2xs transition-colors"
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResendInvite(selectedAppointment.id)}
                      className="py-2 px-3 rounded-lg border border-black/[0.1] bg-white text-zinc-700 hover:bg-zinc-100 text-xs font-semibold shadow-2xs transition-colors"
                    >
                      Resend Invite
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selectedAppointment.id, 'completed')}
                      className="py-2 px-3 rounded-lg border border-black/[0.1] bg-white text-zinc-700 hover:bg-zinc-100 text-xs font-semibold shadow-2xs transition-colors"
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(selectedAppointment.id)}
                      className="py-2 px-3 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleOpen && selectedAppointment && (
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
