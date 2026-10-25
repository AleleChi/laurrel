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
  Check,
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
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';

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
  const [viewMode, setViewMode] = useState<'agenda' | 'table'>('table');

  // Detail Drawer & Modals
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
  const [appointmentActivity, setAppointmentActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState<boolean>(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Confirm dialog for cancellation
  const [cancelDialogState, setCancelDialogState] = useState<{
    isOpen: boolean;
    appointmentId: string | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    appointmentId: null,
    isLoading: false,
  });

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

  const openCancelDialog = (aptId: string) => {
    setCancelDialogState({
      isOpen: true,
      appointmentId: aptId,
      isLoading: false,
    });
  };

  const handleConfirmCancelAppointment = async (reason?: string) => {
    if (!cancelDialogState.appointmentId) return;

    try {
      setCancelDialogState((prev) => ({ ...prev, isLoading: true }));
      const res = await fetch(`/api/admin/appointments/${cancelDialogState.appointmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'Cancelled by staff coordinator', notifyCustomer: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments((prev) =>
          prev.map((a) => (a.id === cancelDialogState.appointmentId ? data.appointment : a))
        );
        if (selectedAppointment?.id === cancelDialogState.appointmentId) {
          setSelectedAppointment(data.appointment);
        }
        setFeedbackMessage('Consultation cancelled successfully.');
        setTimeout(() => setFeedbackMessage(null), 3500);
      }
    } catch (err) {
      console.error('Cancellation failed:', err);
    } finally {
      setCancelDialogState({ isOpen: false, appointmentId: null, isLoading: false });
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

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setStaffFilter('all');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || staffFilter !== 'all';

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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-zinc-900">
            Appointments & Consultations
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage scheduled customer consultations, video meetings, and coordinator assignments in Ottawa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AdminButton
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={loading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </AdminButton>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-[#49056B] text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#49056B] shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-purple-600 hover:text-purple-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOOLBAR: Search, Filters & View Toggles (44px height)                     */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input (6 cols) */}
          <div className="md:col-span-5 relative flex items-center">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search appointments by customer, title, phone..."
              className="w-full h-11 pl-10 pr-10 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-lg placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-zinc-400 hover:text-zinc-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-11 px-3.5 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Coordinator Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full h-11 px-3.5 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
            >
              <option value="all">All Coordinators</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle (2 cols) */}
          <div className="md:col-span-2 flex items-center justify-end gap-1.5 bg-zinc-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'agenda' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Agenda
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
          <span>
            Showing <strong className="text-zinc-900 font-semibold">{filteredAppointments.length}</strong> of{' '}
            <strong className="text-zinc-900 font-semibold">{appointments.length}</strong> scheduled appointments
            {hasActiveFilters && ' (filtered)'}
          </span>
          {hasActiveFilters && (
            <AdminButton variant="ghost" size="sm" onClick={clearAllFilters} leftIcon={<FilterX className="w-3.5 h-3.5" />}>
              Reset Filters
            </AdminButton>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW: Table Mode                                                          */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {filteredAppointments.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    <th className="py-3.5 px-5">Title & Customer</th>
                    <th className="py-3.5 px-4">Format</th>
                    <th className="py-3.5 px-4">Ottawa Date & Time</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Coordinator</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {filteredAppointments.map((apt) => {
                    const isSelected = selectedAppointment?.id === apt.id;
                    return (
                      <tr
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-50/50' : 'hover:bg-zinc-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-zinc-900">{apt.title}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            Customer: {apt.customerName} ({apt.customerEmail})
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-700">
                            {formatAppointmentType(apt.appointmentType)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-zinc-900 text-xs">
                            {formatOttawaDate(apt.scheduledStart)}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            <span>{formatOttawaTime(apt.scheduledStart)} ({apt.durationMinutes}m)</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 hidden md:table-cell text-xs text-zinc-700">
                          {apt.assignedStaffName || <span className="text-zinc-400 italic">Unassigned</span>}
                        </td>

                        <td className="py-3.5 px-4">
                          <AdminBadge status={apt.status} />
                        </td>

                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <AdminButton
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(apt);
                            }}
                            className="text-[#49056B] hover:text-[#390044] hover:bg-purple-50"
                            rightIcon={<ChevronRight className="w-4 h-4" />}
                          >
                            Details
                          </AdminButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">No appointments found</h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    {hasActiveFilters ? 'Try adjusting your search or filters.' : 'No customer appointments scheduled yet.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: Agenda Mode                                                         */}
      {/* ========================================================================= */}
      {viewMode === 'agenda' && (
        <div className="space-y-6">
          {Object.keys(groupedAgenda).length > 0 ? (
            Object.entries(groupedAgenda).map(([dateLabel, aptList]) => (
              <div key={dateLabel} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 bg-zinc-50/80 border-b border-zinc-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[#49056B]" />
                    <span className="font-bold text-sm text-zinc-900">{dateLabel}</span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-500">
                    {aptList.length} appointment{aptList.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="divide-y divide-zinc-100">
                  {aptList.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className="p-5 hover:bg-zinc-50/70 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-zinc-900 text-sm">{apt.title}</span>
                          <AdminBadge status={apt.status} />
                        </div>
                        <div className="text-xs text-zinc-600 flex flex-wrap gap-4 pt-0.5">
                          <span>Customer: <strong className="font-medium text-zinc-800">{apt.customerName}</strong></span>
                          <span>Time: {formatOttawaTimeRange(apt.scheduledStart, apt.scheduledEnd)}</span>
                          <span>Format: {formatAppointmentType(apt.appointmentType)}</span>
                          {apt.assignedStaffName && <span>Staff: {apt.assignedStaffName}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center">
                        <AdminButton
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(apt);
                          }}
                          className="text-[#49056B]"
                          rightIcon={<ChevronRight className="w-4 h-4" />}
                        >
                          View
                        </AdminButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200 p-16 text-center text-sm text-zinc-400">
              No appointments found for the selected filters.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: Appointment Details Slide-Over                                    */}
      {/* ========================================================================= */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-2xs">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l border-zinc-200 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                    {selectedAppointment.title}
                  </h2>
                  <AdminBadge status={selectedAppointment.status} />
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Enquiry Ref: <span className="font-semibold text-zinc-700">#{selectedAppointment.enquiryId.slice(0, 8)}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Standardized Consultation Summary */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-sm text-zinc-700">
                <div>
                  <strong className="text-zinc-900 font-semibold">Date:</strong>{' '}
                  <span>{formatOttawaDate(selectedAppointment.scheduledStart)}</span>
                </div>
                <div>
                  <strong className="text-zinc-900 font-semibold">Time:</strong>{' '}
                  <span>{formatOttawaTimeRange(selectedAppointment.scheduledStart, selectedAppointment.scheduledEnd)} · Ottawa time</span>
                </div>
                <div>
                  <strong className="text-zinc-900 font-semibold">Format:</strong>{' '}
                  <span>{formatAppointmentType(selectedAppointment.appointmentType)}</span>
                </div>
                <div>
                  <strong className="text-zinc-900 font-semibold">Coordinator:</strong>{' '}
                  <span>{selectedAppointment.assignedStaffName || 'Unassigned'}</span>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="space-y-3 pb-4 border-b border-zinc-100">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Customer Information
                </div>
                <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-2 text-sm">
                  <div className="font-bold text-zinc-900">{selectedAppointment.customerName}</div>
                  <div className="text-zinc-600">{selectedAppointment.customerEmail}</div>
                  {selectedAppointment.customerPhone && (
                    <div className="text-zinc-600">Phone: {selectedAppointment.customerPhone}</div>
                  )}
                </div>
              </div>

              {/* Meeting Coordinates / Link */}
              <div className="space-y-3 pb-4 border-b border-zinc-100">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Location & Meeting Coordinates
                </div>
                <div className="p-4 rounded-xl bg-white border border-zinc-200 text-sm">
                  {selectedAppointment.locationOrLink ? (
                    selectedAppointment.locationOrLink.startsWith('http') ? (
                      <a
                        href={selectedAppointment.locationOrLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#49056B] text-white hover:bg-[#390044] text-xs font-semibold transition-colors"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Video Meeting</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <div className="flex items-start gap-2 text-zinc-800">
                        <MapPin className="w-4 h-4 text-zinc-400 mt-0.5" />
                        <span>{selectedAppointment.locationOrLink}</span>
                      </div>
                    )
                  ) : (
                    <span className="text-zinc-400 italic">No location or meeting link recorded</span>
                  )}
                </div>
              </div>

              {/* Staff Notes */}
              {selectedAppointment.staffNotes && (
                <div className="space-y-2 pb-4 border-b border-zinc-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Internal Staff Notes
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                    {selectedAppointment.staffNotes}
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Appointment Audit Activity
                </div>
                {loadingActivity ? (
                  <div className="py-4 text-center text-xs text-zinc-400">Loading activity...</div>
                ) : appointmentActivity.length > 0 ? (
                  <div className="space-y-2.5">
                    {appointmentActivity.map((act) => (
                      <div key={act.id} className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-zinc-500">
                          <span className="font-semibold text-zinc-800">{act.actorName || 'System'}</span>
                          <span>{formatCanadianDateTime(act.createdAt)}</span>
                        </div>
                        <p className="text-zinc-700">{act.action}: {act.details || 'No details'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-400">
                    No activity records logged.
                  </div>
                )}
              </div>

              {/* Actions Toolbar */}
              <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center gap-2.5">
                {selectedAppointment.status === 'pending' && (
                  <AdminButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusUpdate(selectedAppointment.id, 'confirmed')}
                  >
                    Confirm Meeting
                  </AdminButton>
                )}

                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRescheduleOpen(true)}
                >
                  Reschedule
                </AdminButton>

                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleResendInvite(selectedAppointment.id)}
                >
                  Resend Invite
                </AdminButton>

                {selectedAppointment.status !== 'cancelled' && (
                  <AdminButton
                    variant="danger"
                    size="sm"
                    onClick={() => openCancelDialog(selectedAppointment.id)}
                    className="ml-auto"
                  >
                    Cancel Meeting
                  </AdminButton>
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
          onSuccess={async () => {
            await loadData();
            setIsRescheduleOpen(false);
          }}
          enquiryId={selectedAppointment.enquiryId}
          customer={{
            name: selectedAppointment.customerName,
            email: selectedAppointment.customerEmail,
            phone: selectedAppointment.customerPhone || undefined,
          }}
          rescheduleAppointmentId={selectedAppointment.id}
          initialAppointment={selectedAppointment}
        />
      )}

      {/* Confirmation Dialog (replaces window.prompt!) */}
      <ConfirmDialog
        isOpen={cancelDialogState.isOpen}
        title="Cancel Appointment"
        description="Please provide a reason for cancelling this appointment. This note will be recorded in the audit trail and sent to the customer."
        confirmLabel="Cancel Appointment"
        cancelLabel="Keep Appointment"
        variant="danger"
        requiresInput={true}
        inputRequired={true}
        inputLabel="Cancellation Reason"
        inputPlaceholder="e.g. Coordinator conflict, customer requested cancellation..."
        isLoading={cancelDialogState.isLoading}
        onConfirm={handleConfirmCancelAppointment}
        onCancel={() => setCancelDialogState({ isOpen: false, appointmentId: null, isLoading: false })}
      />
    </div>
  );
}
