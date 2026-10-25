'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  Send,
  ArrowRight,
  User,
  Clock,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Ban,
  Check,
  ExternalLink,
  AlertCircle,
  FilterX,
  Copy,
  CheckCircle2,
  Video,
} from 'lucide-react';
import {
  formatEnquirySource,
  formatCanadianDate,
  formatCanadianDateTime,
  formatEnquiryReceivedHeader,
  formatServiceParamLabel,
  formatServiceParamValue,
  formatOttawaAppointmentDate,
  formatOttawaAppointmentTimeRange,
  formatAppointmentType,
  formatAppointmentStatus,
} from '@/lib/utils/formatters';
import ScheduleMeetingModal from '@/components/admin/ScheduleMeetingModal';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';

interface EnquiryItem {
  id: string;
  intent: string;
  source: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  services: string[];
  serviceLocation?: string;
  preferredTiming?: string;
  details: string;
  serviceDetails?: any;
  status: 'new' | 'reviewed' | 'quoted' | 'scheduled' | 'closed';
  emailDelivered: boolean;
  createdAt: string;
  internalNotes?: Array<{
    id: string;
    author: string;
    note: string;
    createdAt: string;
  }>;
}

interface AiHandoffItem {
  id: string;
  sessionId?: string;
  customerName?: string;
  customerEmail: string;
  customerPhone?: string;
  services?: string[];
  serviceLocation?: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export default function AdminEnquiriesPage() {
  const searchParams = useSearchParams();
  const initialEnquiryId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState<'enquiries' | 'handoffs'>('enquiries');
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [handoffs, setHandoffs] = useState<AiHandoffItem[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [totalDbCount, setTotalDbCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [statusError, setStatusError] = useState<string>('');
  const [userRole, setUserRole] = useState<string | null>(null);

  // Appointments state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | null>(null);
  const [enquiryAppointments, setEnquiryAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentActionMsg, setAppointmentActionMsg] = useState<string | null>(null);

  // Custom confirmation dialog for cancellations
  const [cancelDialogState, setCancelDialogState] = useState<{
    isOpen: boolean;
    appointmentId: string | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    appointmentId: null,
    isLoading: false,
  });

  const loadEnquiryAppointments = async (enquiryId: string) => {
    try {
      setLoadingAppointments(true);
      const res = await fetch(`/api/admin/appointments/enquiry/${enquiryId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setEnquiryAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('Failed to load appointments for enquiry:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    if (selectedEnquiry) {
      loadEnquiryAppointments(selectedEnquiry.id);
    } else {
      setEnquiryAppointments([]);
    }
  }, [selectedEnquiry?.id]);

  const handleUpdateAppointmentStatus = async (aptId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/appointments/${aptId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok && selectedEnquiry) {
        await loadEnquiryAppointments(selectedEnquiry.id);
        setAppointmentActionMsg(`Consultation marked as ${newStatus}.`);
        setTimeout(() => setAppointmentActionMsg(null), 3500);
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleResendInvite = async (aptId: string) => {
    try {
      setAppointmentActionMsg('Sending invitation email...');
      const res = await fetch(`/api/admin/appointments/${aptId}/resend-invite`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setAppointmentActionMsg('Invitation email sent successfully.');
      } else {
        setAppointmentActionMsg(`Email delivery notice: ${data.error || 'Service unconfigured'}`);
      }
      setTimeout(() => setAppointmentActionMsg(null), 4000);
    } catch (err: any) {
      setAppointmentActionMsg(`Failed to resend invite: ${err.message}`);
      setTimeout(() => setAppointmentActionMsg(null), 4000);
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

      if (res.ok && selectedEnquiry) {
        await loadEnquiryAppointments(selectedEnquiry.id);
        setAppointmentActionMsg('Consultation cancelled successfully.');
        setTimeout(() => setAppointmentActionMsg(null), 3500);
      }
    } catch (err) {
      console.error('Cancellation failed:', err);
    } finally {
      setCancelDialogState({ isOpen: false, appointmentId: null, isLoading: false });
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const [enqRes, handoffsRes] = await Promise.all([
        fetch('/api/admin/enquiries?limit=200', { cache: 'no-store' }),
        fetch('/api/admin/handoffs', { cache: 'no-store' }),
      ]);

      if (enqRes.ok) {
        const enqData = await enqRes.json();
        const list: EnquiryItem[] = enqData.enquiries || [];
        setEnquiries(list);
        setTotalDbCount(typeof enqData.total === 'number' ? enqData.total : list.length);

        if (initialEnquiryId) {
          const match = list.find((e) => e.id === initialEnquiryId);
          if (match) setSelectedEnquiry(match);
        } else if (selectedEnquiry) {
          const updated = list.find((e) => e.id === selectedEnquiry.id);
          if (updated) setSelectedEnquiry(updated);
        }
      } else {
        const errData = await enqRes.json().catch(() => ({}));
        setApiError(errData.error || `Server responded with status ${enqRes.status}`);
      }

      if (handoffsRes.ok) {
        const hData = await handoffsRes.json();
        setHandoffs(hData.handoffs || []);
      }
    } catch (err: any) {
      console.error('[Enquiries Page Load Error]:', err);
      setApiError('Unable to connect to administrative services. Please check network or server status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetch('/api/admin/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role) setUserRole(data.user.role);
      })
      .catch(() => {});
  }, []);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedEnquiry) return;
    setStatusError('');
    setIsUpdatingStatus(true);

    try {
      const res = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: newNoteText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusError(data.error || 'Failed to update status.');
        setIsUpdatingStatus(false);
        return;
      }

      if (data.enquiry) {
        setSelectedEnquiry(data.enquiry);
        setEnquiries((prev) =>
          prev.map((e) => (e.id === selectedEnquiry.id ? data.enquiry : e))
        );
      }
      setNewNoteText('');
    } catch (err: any) {
      setStatusError('Network error updating enquiry.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNoteOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry || !newNoteText.trim()) return;
    await handleStatusUpdate(selectedEnquiry.status);
  };

  // Filter logic
  const filteredEnquiries = enquiries.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (serviceFilter !== 'all' && !item.services.includes(serviceFilter)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = item.id.toLowerCase().includes(q);
      const matchName = item.customer.name.toLowerCase().includes(q);
      const matchEmail = item.customer.email.toLowerCase().includes(q);
      const matchPhone = item.customer.phone?.toLowerCase().includes(q);
      const matchLoc = item.serviceLocation?.toLowerCase().includes(q);
      return matchId || matchName || matchEmail || matchPhone || matchLoc;
    }

    return true;
  });

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setServiceFilter('all');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || serviceFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-zinc-900">
            Customer Enquiries
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage incoming quote requests, customer consultations, and Ottawa dispatch.
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

      {apiError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={loadData}
            className="text-amber-800 font-semibold underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'enquiries'
                ? 'border-[#49056B] text-[#49056B]'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
            }`}
          >
            Enquiries List
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-zinc-100 text-zinc-600">
              {enquiries.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('handoffs')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'handoffs'
                ? 'border-[#49056B] text-[#49056B]'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
            }`}
          >
            Assistant Callbacks
            {handoffs.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-100 text-[#FE6000] font-bold">
                {handoffs.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TOOLBAR: WowDash & Geex Inspired Consistent Controls (44px height)         */}
      {/* ========================================================================= */}
      {activeTab === 'enquiries' && (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input (6 cols) */}
            <div className="md:col-span-6 relative flex items-center">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer, email, phone, reference..."
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

            {/* Status Filter Dropdown (3 cols) */}
            <div className="md:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-11 px-3.5 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
              >
                <option value="all">All Statuses</option>
                <option value="new">Awaiting Review</option>
                <option value="reviewed">Reviewed</option>
                <option value="quoted">Quoted</option>
                <option value="scheduled">Scheduled</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Service Filter Dropdown (3 cols) */}
            <div className="md:col-span-3 flex items-center gap-2">
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full h-11 px-3.5 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
              >
                <option value="all">All Services</option>
                <option value="moving">Moving</option>
                <option value="cleaning">Cleaning</option>
                <option value="storage">Storage</option>
              </select>

              {hasActiveFilters && (
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="shrink-0 text-zinc-500 hover:text-[#49056B] h-11"
                  leftIcon={<FilterX className="w-4 h-4" />}
                >
                  Reset
                </AdminButton>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
            <span>
              Showing <strong className="text-zinc-900 font-semibold">{filteredEnquiries.length}</strong> of{' '}
              <strong className="text-zinc-900 font-semibold">{enquiries.length}</strong> enquiries
              {hasActiveFilters && ' (filtered)'}
            </span>
            <span>Ottawa Dispatch Region</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DATA TABLE: WowDash & Geex Inspired Complete Container                     */}
      {/* ========================================================================= */}
      {activeTab === 'enquiries' && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {filteredEnquiries.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    <th className="py-3.5 px-5">Reference</th>
                    <th className="py-3.5 px-5">Customer</th>
                    <th className="py-3.5 px-4">Services</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Location</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">Received</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {filteredEnquiries.map((enq) => {
                    const isSelected = selectedEnquiry?.id === enq.id;
                    return (
                      <tr
                        key={enq.id}
                        onClick={() => setSelectedEnquiry(enq)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-50/50' : 'hover:bg-zinc-50/80'
                        }`}
                      >
                        {/* Reference */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                            #{enq.id.slice(0, 8)}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-zinc-900">{enq.customer.name}</div>
                          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                            <span>{enq.customer.email}</span>
                            {enq.customer.phone && (
                              <span>• {enq.customer.phone}</span>
                            )}
                          </div>
                        </td>

                        {/* Services */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {enq.services.map((svc) => (
                              <span
                                key={svc}
                                className="px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 capitalize"
                              >
                                {svc}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 hidden md:table-cell text-zinc-600 text-xs">
                          <div className="flex items-center gap-1.5 max-w-[160px] truncate">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="truncate">{enq.serviceLocation || 'Ottawa, ON'}</span>
                          </div>
                        </td>

                        {/* Received */}
                        <td className="py-3.5 px-4 hidden lg:table-cell text-zinc-500 text-xs whitespace-nowrap">
                          {formatCanadianDate(enq.createdAt)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <AdminBadge status={enq.status} />
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <AdminButton
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEnquiry(enq);
                            }}
                            className="text-[#49056B] hover:text-[#390044] hover:bg-purple-50"
                            rightIcon={<ChevronRight className="w-4 h-4" />}
                          >
                            Review
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
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">No matching enquiries</h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    {hasActiveFilters
                      ? 'Try clearing your filters or search keywords.'
                      : 'No customer enquiries recorded yet.'}
                  </p>
                </div>
                {hasActiveFilters && (
                  <AdminButton variant="outline" size="sm" onClick={clearAllFilters}>
                    Clear all filters
                  </AdminButton>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assistant Handoffs Tab */}
      {activeTab === 'handoffs' && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-200">
            <h2 className="text-base font-bold text-zinc-900">Customer Callback Requests</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Direct telephone or escalation requests received via the interactive assistant.
            </p>
          </div>

          <div className="divide-y divide-zinc-100">
            {handoffs.length > 0 ? (
              handoffs.map((h) => (
                <div key={h.id} className="p-5 hover:bg-zinc-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900 text-sm">
                        {h.customerName || 'Anonymous Customer'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-[#FE6000]">
                        {h.status}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 flex flex-wrap gap-3">
                      <span>Email: {h.customerEmail}</span>
                      {h.customerPhone && <span>Phone: {h.customerPhone}</span>}
                      <span>Location: {h.serviceLocation || 'Ottawa'}</span>
                    </div>
                    <p className="text-sm text-zinc-700 pt-1">
                      Reason: {h.reason}
                    </p>
                  </div>
                  <div className="text-xs text-zinc-400 sm:text-right">
                    {formatCanadianDateTime(h.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-sm text-zinc-400">
                No customer callback requests recorded.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: Redesigned Customer Workspace Slide-Over                          */}
      {/* ========================================================================= */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-2xs">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l border-zinc-200 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                    {selectedEnquiry.customer.name}
                  </h2>
                  <AdminBadge status={selectedEnquiry.status} />
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Ref: <span className="font-semibold text-zinc-700">#{selectedEnquiry.id.slice(0, 8)}</span> •{' '}
                  {formatEnquiryReceivedHeader(selectedEnquiry.createdAt, selectedEnquiry.source)}
                </p>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* 1. Customer Contact Card */}
              <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Customer Contact Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <a
                    href={`mailto:${selectedEnquiry.customer.email}`}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-white border border-zinc-200 text-zinc-800 hover:border-[#49056B] transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#49056B] shrink-0" />
                    <span className="truncate font-medium">{selectedEnquiry.customer.email}</span>
                  </a>

                  {selectedEnquiry.customer.phone ? (
                    <a
                      href={`tel:${selectedEnquiry.customer.phone}`}
                      className="flex items-center gap-2.5 p-3 rounded-lg bg-white border border-zinc-200 text-zinc-800 hover:border-[#FE6000] transition-colors"
                    >
                      <Phone className="w-4 h-4 text-[#FE6000] shrink-0" />
                      <span className="font-medium">{selectedEnquiry.customer.phone}</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-white border border-zinc-200 text-zinc-400">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>No phone provided</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Requested Services & Scope */}
              <div className="space-y-3 pb-5 border-b border-zinc-100">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Requested Services & Scope
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedEnquiry.services.map((svc) => (
                    <span
                      key={svc}
                      className="px-3 py-1 rounded-lg bg-purple-50 text-[#49056B] border border-purple-200 text-xs font-semibold capitalize"
                    >
                      {svc}
                    </span>
                  ))}
                </div>

                {selectedEnquiry.serviceDetails && Object.keys(selectedEnquiry.serviceDetails).length > 0 && (
                  <div className="mt-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Scope Specifications
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {Object.entries(selectedEnquiry.serviceDetails).flatMap(([cat, catVal]) => {
                        if (catVal && typeof catVal === 'object' && !Array.isArray(catVal)) {
                          return Object.entries(catVal)
                            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
                            .map(([subK, subV]) => (
                              <div key={`${cat}_${subK}`} className="space-y-0.5">
                                <span className="text-[11px] text-zinc-400 font-medium block">
                                  {formatServiceParamLabel(subK)}
                                </span>
                                <span className="text-zinc-800 font-semibold text-xs block">
                                  {formatServiceParamValue(subV)}
                                </span>
                              </div>
                            ));
                        }
                        if (catVal !== undefined && catVal !== null && catVal !== '') {
                          return [
                            <div key={cat} className="space-y-0.5">
                              <span className="text-[11px] text-zinc-400 font-medium block">
                                {formatServiceParamLabel(cat)}
                              </span>
                              <span className="text-zinc-800 font-semibold text-xs block">
                                {formatServiceParamValue(catVal)}
                              </span>
                            </div>,
                          ];
                        }
                        return [];
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Location & Timing */}
              <div className="space-y-3 pb-5 border-b border-zinc-100">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Location & Timing
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-zinc-700">
                    <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{selectedEnquiry.serviceLocation || 'Ottawa, ON Area'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-700">
                    <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{selectedEnquiry.preferredTiming || 'Flexible / As soon as possible'}</span>
                  </div>
                </div>
              </div>

              {/* 4. Customer Project Description */}
              {selectedEnquiry.details && (
                <div className="space-y-2 pb-5 border-b border-zinc-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Customer Project Notes
                  </div>
                  <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                    {selectedEnquiry.details}
                  </div>
                </div>
              )}

              {/* 5. Scheduled Consultations Section */}
              <div className="space-y-4 pb-5 border-b border-zinc-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Scheduled Consultations
                  </div>
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRescheduleAppointmentId(null);
                      setIsScheduleModalOpen(true);
                    }}
                    leftIcon={<CalendarPlus className="w-4 h-4 text-[#49056B]" />}
                  >
                    Schedule Meeting
                  </AdminButton>
                </div>

                {appointmentActionMsg && (
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs font-medium">
                    {appointmentActionMsg}
                  </div>
                )}

                {loadingAppointments ? (
                  <div className="py-6 text-center text-sm text-zinc-400">
                    Loading consultations...
                  </div>
                ) : enquiryAppointments.length === 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-500 text-center">
                    No consultations scheduled yet for this enquiry.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enquiryAppointments.map((apt) => {
                      const isPhone = apt.appointmentType === 'telephone';
                      const isVideo = ['google_meet', 'ms_teams', 'zoom'].includes(apt.appointmentType);
                      const isSiteOrPerson = ['on_site', 'in_person'].includes(apt.appointmentType);

                      const rawLoc = apt.locationOrLink?.trim() || '';
                      const isPlaceholderPhone =
                        !rawLoc ||
                        /phone number to be confirmed/i.test(rawLoc) ||
                        /customer telephone number/i.test(rawLoc) ||
                        /telephone call to customer/i.test(rawLoc);

                      const resolvedPhone = !isPlaceholderPhone ? rawLoc : (selectedEnquiry?.customer?.phone?.trim() || null);
                      const hasValidVideoUrl = isVideo && (rawLoc.startsWith('http://') || rawLoc.startsWith('https://'));
                      const coordinator = apt.assignedStaffName?.trim() || 'Coordinator not assigned';

                      return (
                        <div
                          key={apt.id}
                          className="p-5 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-4 transition-all"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-sm font-bold text-zinc-900">
                                {apt.title}
                              </h4>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {formatAppointmentType(apt.appointmentType)}
                              </p>
                            </div>
                            <AdminBadge status={apt.status} />
                          </div>

                          {/* Standardized Consultation Summary */}
                          <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-2 text-sm text-zinc-700">
                            <div>
                              <strong className="text-zinc-900 font-semibold">Date:</strong>{' '}
                              <span>{formatOttawaAppointmentDate(apt.scheduledStart)}</span>
                            </div>
                            <div>
                              <strong className="text-zinc-900 font-semibold">Time:</strong>{' '}
                              <span>{formatOttawaAppointmentTimeRange(apt.scheduledStart, apt.scheduledEnd)}</span>
                            </div>
                            <div>
                              <strong className="text-zinc-900 font-semibold">Format:</strong>{' '}
                              <span>{formatAppointmentType(apt.appointmentType)}</span>
                            </div>
                            <div>
                              <strong className="text-zinc-900 font-semibold">Coordinator:</strong>{' '}
                              <span>{coordinator}</span>
                            </div>
                          </div>

                          {/* Location / Meeting Link */}
                          <div className="space-y-2 text-xs">
                            {isPhone && resolvedPhone && (
                              <div className="flex items-center gap-2 text-zinc-800">
                                <Phone className="w-4 h-4 text-zinc-400" />
                                <span>Customer phone: <strong className="font-semibold">{resolvedPhone}</strong></span>
                              </div>
                            )}

                            {isVideo && (
                              <div>
                                {hasValidVideoUrl ? (
                                  <a
                                    href={rawLoc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#49056B] text-white hover:bg-[#390044] text-xs font-semibold transition-colors"
                                  >
                                    <Video className="w-4 h-4" />
                                    <span>Join Meeting</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <div className="text-xs text-zinc-400 italic">
                                    Meeting link will be provided once meeting is confirmed.
                                  </div>
                                )}
                              </div>
                            )}

                            {isSiteOrPerson && rawLoc && !isPlaceholderPhone && (
                              <div className="flex items-start gap-2 text-zinc-700">
                                <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                                <span>{rawLoc}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-100">
                            {apt.status === 'pending' && (
                              <AdminButton
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateAppointmentStatus(apt.id, 'confirmed')}
                                className="text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                              >
                                Confirm Meeting
                              </AdminButton>
                            )}

                            <AdminButton
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRescheduleAppointmentId(apt.id);
                                setIsScheduleModalOpen(true);
                              }}
                            >
                              Reschedule
                            </AdminButton>

                            <AdminButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvite(apt.id)}
                            >
                              Resend Invite
                            </AdminButton>

                            {apt.status !== 'cancelled' && (
                              <AdminButton
                                variant="outline"
                                size="sm"
                                onClick={() => openCancelDialog(apt.id)}
                                className="text-red-700 hover:bg-red-50 border-red-200 ml-auto"
                              >
                                Cancel
                              </AdminButton>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 6. Lead Status & Internal Notes */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Enquiry Status & Coordination Notes
                </div>

                {statusError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                    {statusError}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {(['new', 'reviewed', 'quoted', 'scheduled', 'closed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusUpdate(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedEnquiry.status === st
                          ? 'bg-[#49056B] text-white border-[#49056B]'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      {st === 'new'
                        ? 'Awaiting Review'
                        : st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAddNoteOnly} className="space-y-2 pt-2">
                  <textarea
                    rows={3}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add an internal coordinator note regarding this enquiry..."
                    className="w-full p-3 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
                  />
                  <div className="flex justify-end">
                    <AdminButton
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={!newNoteText.trim() || isUpdatingStatus}
                      isLoading={isUpdatingStatus}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Save Note
                    </AdminButton>
                  </div>
                </form>

                {/* Notes History */}
                {selectedEnquiry.internalNotes && selectedEnquiry.internalNotes.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Historical Notes
                    </div>
                    {selectedEnquiry.internalNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-zinc-500 font-medium">
                          <span>{note.author}</span>
                          <span>{formatCanadianDateTime(note.createdAt)}</span>
                        </div>
                        <p className="text-zinc-800 text-sm">{note.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {isScheduleModalOpen && (
        <ScheduleMeetingModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setRescheduleAppointmentId(null);
          }}
          onSuccess={async () => {
            if (selectedEnquiry) {
              await loadEnquiryAppointments(selectedEnquiry.id);
              await loadData();
            }
          }}
          enquiry={selectedEnquiry || undefined}
          rescheduleAppointmentId={rescheduleAppointmentId}
        />
      )}

      {/* Custom Confirmation Dialog for Cancellations (replaces window.prompt!) */}
      <ConfirmDialog
        isOpen={cancelDialogState.isOpen}
        title="Cancel Consultation"
        description="Please provide a reason for cancelling this appointment. This note will be recorded in the system audit log and shared with the customer if notifications are enabled."
        confirmLabel="Cancel Appointment"
        cancelLabel="Keep Appointment"
        variant="danger"
        requiresInput={true}
        inputRequired={true}
        inputLabel="Cancellation Reason"
        inputPlaceholder="e.g. Schedule conflict, customer requested cancellation..."
        isLoading={cancelDialogState.isLoading}
        onConfirm={handleConfirmCancelAppointment}
        onCancel={() => setCancelDialogState({ isOpen: false, appointmentId: null, isLoading: false })}
      />
    </div>
  );
}
