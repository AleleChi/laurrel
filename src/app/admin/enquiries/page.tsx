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
  CalendarCheck,
  RotateCcw,
  Ban,
  Check,
  ExternalLink,
  AlertCircle,
  FilterX,
} from 'lucide-react';
import {
  formatEnquirySource,
  formatCanadianDate,
  formatCanadianDateTime,
  formatEnquiryReceivedHeader,
  formatNoteAuthor,
  formatNoteContent,
  formatServiceParamLabel,
  formatServiceParamValue,
  formatOttawaDate,
  formatOttawaTimeRange,
  formatAppointmentType,
  formatAppointmentStatus,
} from '@/lib/utils/formatters';
import ScheduleMeetingModal from '@/components/admin/ScheduleMeetingModal';

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

  const handleCancelAppointment = async (aptId: string) => {
    const reason = window.prompt('Please provide a reason for cancelling this appointment:');
    if (!reason || !reason.trim()) return;

    try {
      const res = await fetch(`/api/admin/appointments/${aptId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim(), notifyCustomer: true }),
      });
      if (res.ok && selectedEnquiry) {
        await loadEnquiryAppointments(selectedEnquiry.id);
        setAppointmentActionMsg('Consultation cancelled.');
        setTimeout(() => setAppointmentActionMsg(null), 3500);
      }
    } catch (err) {
      console.error('Cancellation failed:', err);
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

  const renderStatus = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 text-[#FE6000] border border-orange-200/60">
            Awaiting Review
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            Reviewed
          </span>
        );
      case 'quoted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-[#49056B] border border-purple-200/60">
            Quoted
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Scheduled
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-50 text-zinc-400 border border-zinc-200/60">
            Closed
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
    setServiceFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Segmented View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Customer Enquiries
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage quote requests, qualify customer requirements, and coordinate service consultations.
          </p>
        </div>

        <div className="flex items-center p-1 bg-zinc-200/70 rounded-md self-start sm:self-auto border border-zinc-200/80">
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'enquiries'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Inbound Enquiries ({totalDbCount ?? enquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('handoffs')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'handoffs'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Callback Requests ({handoffs.length})
          </button>
        </div>
      </div>

      {/* Unified CRM Filter Toolbar (WowDash / Geex Inspired) */}
      <div className="bg-white rounded-md p-3 border border-zinc-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, email, phone, location or ID..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
            >
              <option value="all">All Statuses</option>
              <option value="new">Awaiting Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="quoted">Quoted</option>
              <option value="scheduled">Scheduled</option>
              <option value="closed">Closed</option>
            </select>

            {/* Service Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              aria-label="Filter by service"
              className="px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
            >
              <option value="all">All Services</option>
              <option value="cleaning">Cleaning</option>
              <option value="moving">Moving</option>
              <option value="storage">Storage</option>
              <option value="general">General</option>
            </select>

            {(statusFilter !== 'all' || serviceFilter !== 'all' || searchQuery.trim()) && (
              <>
                <span className="text-[11px] text-zinc-500 font-medium px-2 py-1.5 rounded bg-zinc-100 whitespace-nowrap">
                  Showing {filteredEnquiries.length} of {totalDbCount ?? enquiries.length}
                </span>
                <button
                  onClick={resetFilters}
                  title="Reset filters"
                  className="px-2.5 py-2 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </>
            )}

            <button
              onClick={loadData}
              title="Refresh data"
              aria-label="Refresh data"
              disabled={loading}
              className="p-2 rounded-md bg-zinc-50 border border-zinc-200/80 text-zinc-600 hover:text-[#49056B] hover:bg-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#49056B]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main CRM Table Area */}
      {activeTab === 'enquiries' ? (
        <div className="bg-white rounded-md border border-zinc-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 sm:px-6">Customer</th>
                  <th className="py-3 px-4 sm:px-6">Services</th>
                  <th className="py-3 px-4 sm:px-6 hidden md:table-cell">Location</th>
                  <th className="py-3 px-4 sm:px-6 hidden sm:table-cell">Received</th>
                  <th className="py-3 px-4 sm:px-6">Status</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {/* 1. Loading State */}
                {loading && enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-zinc-400">
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <RefreshCw className="w-5 h-5 text-[#49056B] animate-spin" />
                        <span className="text-xs text-zinc-500 font-medium">
                          Loading enquiries from database...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : apiError ? (
                  /* 2. API Error State (Demonstrating true cause rather than false empty list) */
                  <tr>
                    <td colSpan={6} className="py-12 px-6 text-center">
                      <div className="max-w-md mx-auto space-y-2">
                        <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                        <h3 className="text-sm font-bold text-zinc-900">
                          Unable to retrieve customer enquiries
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {apiError}
                        </p>
                        <button
                          onClick={loadData}
                          className="mt-3 px-3.5 py-1.5 rounded-md bg-[#49056B] text-white text-xs font-semibold hover:bg-[#390044] transition-colors"
                        >
                          Retry Request
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : enquiries.length === 0 ? (
                  /* 3. Empty Database State */
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-zinc-400">
                      <div className="max-w-sm mx-auto space-y-1">
                        <p className="text-sm font-semibold text-zinc-700">No customer enquiries recorded yet</p>
                        <p className="text-xs text-zinc-400">
                          Inbound requests submitted through the website or customer portal will appear here in real time.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredEnquiries.length === 0 ? (
                  /* 4. Filter No-Match State */
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      <div className="max-w-sm mx-auto space-y-2">
                        <p className="text-sm font-semibold text-zinc-700">No enquiries match the selected filters</p>
                        <p className="text-xs text-zinc-400">
                          Try adjusting your status, service or search criteria.
                        </p>
                        <button
                          onClick={resetFilters}
                          className="mt-2 text-xs font-semibold text-[#49056B] hover:underline"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEnquiries.map((enq) => {
                    const isSelected = selectedEnquiry?.id === enq.id;
                    return (
                      <tr
                        key={enq.id}
                        onClick={() => setSelectedEnquiry(enq)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#49056B]/[0.05] border-l-2 border-[#49056B]'
                            : 'hover:bg-zinc-50/70'
                        }`}
                      >
                        <td className="py-3 px-4 sm:px-6">
                          <div className="font-semibold text-zinc-900">{enq.customer.name}</div>
                          <div className="text-[11px] text-zinc-500 truncate max-w-[200px]">
                            {enq.customer.email}
                          </div>
                          {enq.customer.phone && (
                            <div className="text-[10px] text-zinc-400">
                              {enq.customer.phone}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 sm:px-6">
                          <div className="flex flex-wrap gap-1">
                            {enq.services.map((svc) => (
                              <span
                                key={svc}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700 capitalize"
                              >
                                {svc}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 sm:px-6 hidden md:table-cell text-zinc-600">
                          {enq.serviceLocation || 'Ottawa Area'}
                        </td>
                        <td className="py-3 px-4 sm:px-6 hidden sm:table-cell text-zinc-500">
                          {formatCanadianDate(enq.createdAt)}
                        </td>
                        <td className="py-3 px-4 sm:px-6">
                          {renderStatus(enq.status)}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#49056B] hover:text-[#390044]">
                            <span>Review</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Customer Callback Requests Tab */
        <div className="bg-white rounded-md border border-zinc-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 sm:px-6">Customer Contact</th>
                  <th className="py-3 px-4 sm:px-6">Callback Details</th>
                  <th className="py-3 px-4 sm:px-6">Services</th>
                  <th className="py-3 px-4 sm:px-6">Requested</th>
                  <th className="py-3 px-4 sm:px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {handoffs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400">
                      No customer callback requests on record.
                    </td>
                  </tr>
                ) : (
                  handoffs.map((h) => (
                    <tr key={h.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-4 sm:px-6">
                        <div className="font-semibold text-zinc-900">
                          {h.customerName || 'Laurrel Visitor'}
                        </div>
                        <div className="text-zinc-500 text-[11px]">{h.customerEmail}</div>
                        {h.customerPhone && (
                          <div className="text-zinc-400 text-[11px]">{h.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 sm:px-6 max-w-sm text-zinc-700">
                        {h.reason}
                      </td>
                      <td className="py-3 px-4 sm:px-6">
                        <span className="text-xs text-zinc-700 capitalize font-medium">
                          {(h.services || ['general']).join(' • ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-zinc-500">
                        {formatCanadianDate(h.createdAt)}
                      </td>
                      <td className="py-3 px-4 sm:px-6">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 capitalize">
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refined CRM Slide-Over Drawer — Customer Workspace */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-2xs">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l border-zinc-200 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/60">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-zinc-900 tracking-tight">
                    {selectedEnquiry.customer.name}
                  </span>
                  {renderStatus(selectedEnquiry.status)}
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Reference: {selectedEnquiry.id} • {formatEnquiryReceivedHeader(selectedEnquiry.createdAt, selectedEnquiry.source)}
                </p>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* 1. Customer Contact Card */}
              <div className="space-y-3 pb-5 border-b border-zinc-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Customer Contact Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <a
                    href={`mailto:${selectedEnquiry.customer.email}`}
                    className="inline-flex items-center gap-2 p-2.5 rounded-md bg-zinc-50 border border-zinc-200/60 text-zinc-800 hover:border-zinc-300 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#49056B] shrink-0" />
                    <span className="truncate font-medium">{selectedEnquiry.customer.email}</span>
                  </a>

                  {selectedEnquiry.customer.phone ? (
                    <a
                      href={`tel:${selectedEnquiry.customer.phone}`}
                      className="inline-flex items-center gap-2 p-2.5 rounded-md bg-zinc-50 border border-zinc-200/60 text-zinc-800 hover:border-zinc-300 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-[#FE6000] shrink-0" />
                      <span className="font-medium">{selectedEnquiry.customer.phone}</span>
                    </a>
                  ) : (
                    <div className="inline-flex items-center gap-2 p-2.5 rounded-md bg-zinc-50 border border-zinc-200/60 text-zinc-400">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>No phone provided</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Requested Services */}
              <div className="space-y-3 pb-5 border-b border-zinc-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Requested Services & Scope
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEnquiry.services.map((svc) => (
                    <span
                      key={svc}
                      className="px-2.5 py-1 rounded-md bg-purple-50 text-[#49056B] border border-purple-200/60 text-xs font-semibold capitalize"
                    >
                      {svc}
                    </span>
                  ))}
                </div>

                {/* Service-Specific Parameters (Human Readable) */}
                {selectedEnquiry.serviceDetails && Object.keys(selectedEnquiry.serviceDetails).length > 0 && (
                  <div className="mt-3 p-3.5 bg-zinc-50 rounded-md border border-zinc-200/70 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Scope Specifications
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {Object.entries(selectedEnquiry.serviceDetails).flatMap(([cat, catVal]) => {
                        if (catVal && typeof catVal === 'object' && !Array.isArray(catVal)) {
                          return Object.entries(catVal)
                            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
                            .map(([subK, subV]) => (
                              <div key={`${cat}_${subK}`} className="space-y-0.5">
                                <span className="text-[10px] text-zinc-400 font-medium block">
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
                              <span className="text-[10px] text-zinc-400 font-medium block">
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

                    {/* Authorised Diagnostic Payload (System Owner Only) */}
                    {userRole === 'owner' && (
                      <details className="mt-3 pt-2 border-t border-zinc-200/70 text-[10px] text-zinc-400">
                        <summary className="cursor-pointer hover:text-zinc-600 transition-colors">
                          Authorised Diagnostic Payload (System Owner)
                        </summary>
                        <pre className="mt-1.5 p-2 bg-white rounded border border-zinc-200 font-mono text-[10px] overflow-x-auto text-zinc-600">
                          {JSON.stringify(selectedEnquiry.serviceDetails, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Service Location & Timing */}
              <div className="space-y-3 pb-5 border-b border-zinc-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Location & Timing
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="inline-flex items-center gap-2 text-zinc-700">
                    <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{selectedEnquiry.serviceLocation || 'Ottawa, ON Area'}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 text-zinc-700">
                    <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{selectedEnquiry.preferredTiming || 'Flexible / As soon as possible'}</span>
                  </div>
                </div>
              </div>

              {/* 4. Customer Project Description */}
              {selectedEnquiry.details && (
                <div className="space-y-2 pb-5 border-b border-zinc-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Customer Project Notes
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-md border border-zinc-200/60 text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                    {selectedEnquiry.details}
                  </div>
                </div>
              )}

              {/* 5. Consultation Appointments Section */}
              <div className="space-y-3 pb-5 border-b border-zinc-100">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Scheduled Consultations
                  </div>
                  <button
                    onClick={() => {
                      setRescheduleAppointmentId(null);
                      setIsScheduleModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#49056B] hover:text-[#390044] px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 transition-colors"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Schedule Meeting</span>
                  </button>
                </div>

                {appointmentActionMsg && (
                  <div className="p-2.5 rounded-md bg-purple-50 border border-purple-200 text-purple-900 text-xs font-medium">
                    {appointmentActionMsg}
                  </div>
                )}

                {loadingAppointments ? (
                  <div className="py-4 text-center text-xs text-zinc-400">
                    Loading appointments...
                  </div>
                ) : enquiryAppointments.length === 0 ? (
                  <div className="p-3.5 rounded-md bg-zinc-50 border border-zinc-200/60 text-xs text-zinc-500 text-center">
                    No consultations scheduled yet for this enquiry.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {enquiryAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3 rounded-md bg-zinc-50 border border-zinc-200/80 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-900">{apt.title}</span>
                          {(() => {
                            const statusInfo = formatAppointmentStatus(apt.status);
                            return (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusInfo.bg} ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            );
                          })()}
                        </div>

                        <div className="text-zinc-600 space-y-1 text-[11px]">
                          <div>
                            Mode: <span className="font-medium capitalize">{formatAppointmentType(apt.appointmentType)}</span>
                            {apt.locationOrLink && (
                              <span className="ml-2 font-mono text-[10px] text-zinc-500">
                                ({apt.locationOrLink})
                              </span>
                            )}
                          </div>
                          <div>
                            Time: <span className="font-medium">{formatOttawaDate(apt.scheduledStart)} at {formatOttawaTimeRange(apt.scheduledStart, apt.scheduledEnd)}</span>
                          </div>
                          {apt.assignedStaffName && (
                            <div>
                              Coordinator: <span className="font-medium">{apt.assignedStaffName}</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/60">
                          {apt.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateAppointmentStatus(apt.id, 'confirmed')}
                              className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[10px] transition-colors"
                            >
                              Confirm
                            </button>
                          )}
                          {apt.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateAppointmentStatus(apt.id, 'completed')}
                              className="px-2 py-1 rounded bg-zinc-100 text-zinc-700 hover:bg-zinc-200 font-semibold text-[10px] transition-colors"
                            >
                              Mark Completed
                            </button>
                          )}
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                            <>
                              <button
                                onClick={() => {
                                  setRescheduleAppointmentId(apt.id);
                                  setIsScheduleModalOpen(true);
                                }}
                                className="px-2 py-1 rounded bg-purple-50 text-[#49056B] hover:bg-purple-100 font-semibold text-[10px] transition-colors"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleCancelAppointment(apt.id)}
                                className="px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-[10px] transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleResendInvite(apt.id)}
                            className="px-2 py-1 rounded bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-medium text-[10px] ml-auto transition-colors"
                          >
                            Resend Email
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. Lead Status Workflow Transition */}
              <div className="space-y-3 pb-5 border-b border-zinc-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Update Enquiry Status
                </div>
                {statusError && (
                  <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
                    {statusError}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {(['new', 'reviewed', 'quoted', 'scheduled', 'closed'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusUpdate(st)}
                      disabled={isUpdatingStatus || selectedEnquiry.status === st}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                        selectedEnquiry.status === st
                          ? 'bg-[#49056B] text-white shadow-2xs'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 disabled:opacity-50'
                      }`}
                    >
                      {st === 'new' ? 'New Lead' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Internal Coordinator Notes */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Internal Staff Notes
                </div>

                <form onSubmit={handleAddNoteOnly} className="space-y-2">
                  <textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add operational notes, pricing considerations, or follow-up notes..."
                    rows={3}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:bg-white transition-all"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newNoteText.trim() || isUpdatingStatus}
                      className="px-3.5 py-1.5 rounded-md bg-[#49056B] text-white text-xs font-semibold hover:bg-[#390044] transition-colors disabled:opacity-50"
                    >
                      Save Note
                    </button>
                  </div>
                </form>

                {selectedEnquiry.internalNotes && selectedEnquiry.internalNotes.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {selectedEnquiry.internalNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-zinc-50 rounded-md border border-zinc-200/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-zinc-500">
                          <span className="font-semibold text-zinc-700">
                            {formatNoteAuthor(note.author)}
                          </span>
                          <span>{formatCanadianDateTime(note.createdAt)}</span>
                        </div>
                        <p className="text-zinc-800 leading-relaxed whitespace-pre-wrap">
                          {formatNoteContent(note.note)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Booking / Rescheduling Modal */}
      {selectedEnquiry && (
        <ScheduleMeetingModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setRescheduleAppointmentId(null);
          }}
          enquiryId={selectedEnquiry.id}
          customer={{
            name: selectedEnquiry.customer.name,
            email: selectedEnquiry.customer.email,
            phone: selectedEnquiry.customer.phone,
          }}
          rescheduleAppointmentId={rescheduleAppointmentId}
          onSuccess={() => {
            if (selectedEnquiry) {
              loadEnquiryAppointments(selectedEnquiry.id);
            }
            loadData();
          }}
        />
      )}
    </div>
  );
}
