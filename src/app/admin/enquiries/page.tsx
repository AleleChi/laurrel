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
  status: 'pending' | 'contacted' | 'resolved' | 'dismissed';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface StatusCounts {
  all: number;
  new: number;
  reviewed: number;
  quoted: number;
  scheduled: number;
  closed: number;
}

interface HandoffCounts {
  all: number;
  pending: number;
  contacted: number;
  resolved: number;
  dismissed: number;
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

  const [statusCounts, setStatusCounts] = useState<StatusCounts | null>(null);
  const [handoffStatusFilter, setHandoffStatusFilter] = useState<string>('all');
  const [handoffSearchQuery, setHandoffSearchQuery] = useState<string>('');
  const [handoffActionMsg, setHandoffActionMsg] = useState<string | null>(null);
  const [isUpdatingHandoffId, setIsUpdatingHandoffId] = useState<string | null>(null);

  const [serverHandoffCounts, setServerHandoffCounts] = useState<HandoffCounts | null>(null);
  const [handoffTotal, setHandoffTotal] = useState<number>(0);
  const [dismissDialogState, setDismissDialogState] = useState<{
    isOpen: boolean;
    handoffId: string | null;
    customerName: string;
    reason: string;
    errorMessage: string | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    handoffId: null,
    customerName: '',
    reason: '',
    errorMessage: null,
    isLoading: false,
  });

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
        if (enqData.statusCounts) {
          setStatusCounts(enqData.statusCounts);
        }

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
        if (hData.statusCounts) {
          setServerHandoffCounts(hData.statusCounts);
        }
        if (typeof hData.total === 'number') {
          setHandoffTotal(hData.total);
        }
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
        const prevStatus = selectedEnquiry.status;
        setSelectedEnquiry(data.enquiry);
        setEnquiries((prev) =>
          prev.map((e) => (e.id === selectedEnquiry.id ? data.enquiry : e))
        );
        if (prevStatus !== newStatus && statusCounts) {
          setStatusCounts({
            ...statusCounts,
            [prevStatus]: Math.max(0, (statusCounts as any)[prevStatus] - 1),
            [newStatus]: ((statusCounts as any)[newStatus] || 0) + 1,
          });
        }
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

  // Status Counts calculation (Task 4)
  const counts: StatusCounts = statusCounts || {
    all: enquiries.length,
    new: enquiries.filter((e) => e.status === 'new').length,
    reviewed: enquiries.filter((e) => e.status === 'reviewed').length,
    quoted: enquiries.filter((e) => e.status === 'quoted').length,
    scheduled: enquiries.filter((e) => e.status === 'scheduled').length,
    closed: enquiries.filter((e) => e.status === 'closed').length,
  };

  const handoffCounts: HandoffCounts = serverHandoffCounts || {
    all: handoffs.length,
    pending: handoffs.filter((h) => h.status === 'pending').length,
    contacted: handoffs.filter((h) => h.status === 'contacted').length,
    resolved: handoffs.filter((h) => h.status === 'resolved').length,
    dismissed: handoffs.filter((h) => h.status === 'dismissed').length,
  };

  const canManageHandoffs = userRole ? ['owner', 'admin', 'operations_staff'].includes(userRole) : true;

  const handleUpdateHandoffStatus = async (
    id: string,
    newStatus: string,
    note?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsUpdatingHandoffId(id);
      const res = await fetch(`/api/admin/handoffs/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || 'Failed to update callback status.';
        setHandoffActionMsg(errorMsg);
        setTimeout(() => setHandoffActionMsg(null), 5000);
        return { success: false, error: errorMsg };
      }

      setHandoffs((prev) =>
        prev.map((h) => (h.id === id ? { ...h, status: newStatus as any, notes: note || h.notes } : h))
      );

      // Optimistically adjust status counts
      if (serverHandoffCounts) {
        const target = handoffs.find((h) => h.id === id);
        const prev = target?.status;
        if (prev && prev !== newStatus) {
          setServerHandoffCounts({
            ...serverHandoffCounts,
            [prev]: Math.max(0, (serverHandoffCounts as any)[prev] - 1),
            [newStatus]: ((serverHandoffCounts as any)[newStatus] || 0) + 1,
          });
        }
      }

      const statusLabels: Record<string, string> = {
        contacted: 'marked as Contacted',
        resolved: 'marked as Resolved',
        dismissed: 'dismissed',
        pending: 'reopened as Awaiting Contact',
      };
      setHandoffActionMsg(`Callback request ${statusLabels[newStatus] || newStatus}.`);
      setTimeout(() => setHandoffActionMsg(null), 3500);
      return { success: true };
    } catch (err: any) {
      console.error('Error updating handoff status:', err);
      const errorMsg = 'Network error updating callback status.';
      setHandoffActionMsg(errorMsg);
      setTimeout(() => setHandoffActionMsg(null), 5000);
      return { success: false, error: errorMsg };
    } finally {
      setIsUpdatingHandoffId(null);
    }
  };

  const openDismissDialog = (h: AiHandoffItem) => {
    setDismissDialogState({
      isOpen: true,
      handoffId: h.id,
      customerName: h.customerName || h.customerEmail,
      reason: '',
      errorMessage: null,
      isLoading: false,
    });
  };

  const handleConfirmDismissHandoff = async (reason?: string) => {
    if (!dismissDialogState.handoffId) return;
    setDismissDialogState((prev) => ({ ...prev, isLoading: true, reason: reason || '', errorMessage: null }));

    const result = await handleUpdateHandoffStatus(
      dismissDialogState.handoffId,
      'dismissed',
      reason || 'Dismissed by coordinator'
    );

    if (result.success) {
      // Close modal ONLY on confirmed API success
      setDismissDialogState({
        isOpen: false,
        handoffId: null,
        customerName: '',
        reason: '',
        errorMessage: null,
        isLoading: false,
      });
    } else {
      // Keep modal open, preserve entered reason, show error, permit retry
      setDismissDialogState((prev) => ({
        ...prev,
        isLoading: false,
        reason: reason || '',
        errorMessage: result.error || 'Failed to dismiss callback request. Please try again.',
      }));
    }
  };

  const filteredHandoffs = handoffs.filter((h) => {
    if (handoffStatusFilter !== 'all' && h.status !== handoffStatusFilter) return false;
    if (handoffSearchQuery.trim()) {
      const q = handoffSearchQuery.toLowerCase().trim();
      const matchName = h.customerName?.toLowerCase().includes(q);
      const matchEmail = h.customerEmail.toLowerCase().includes(q);
      const matchPhone = h.customerPhone?.toLowerCase().includes(q);
      const matchReason = h.reason.toLowerCase().includes(q);
      const matchLoc = h.serviceLocation?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchReason || matchLoc;
    }
    return true;
  });

  const renderHandoffStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Awaiting Contact
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            Contacted
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Resolved
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
            <Ban className="w-3 h-3 text-zinc-400" />
            Dismissed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600">
            {status}
          </span>
        );
    }
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
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between">
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
            <span className="ml-2 px-2 py-0.5 text-xs rounded-[4px] bg-zinc-100 text-zinc-600">
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
            {handoffCounts.all > 0 && (
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-bold ${
                handoffCounts.pending > 0
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-zinc-100 text-zinc-600'
              }`}>
                {handoffCounts.pending > 0 ? `${handoffCounts.pending} pending` : handoffCounts.all}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TOOLBAR: WowDash & Geex Inspired Consistent Controls (44px height)         */}
      {/* ========================================================================= */}
      {activeTab === 'enquiries' && (
        <div className="bg-white p-4 sm:p-5 rounded-md border border-zinc-200 shadow-sm space-y-4">
          {/* Quick-Filter Status Chips with Live Counts (Task 4) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'new', label: 'Awaiting Review', count: counts.new, alert: counts.new > 0 },
              { id: 'reviewed', label: 'Reviewed', count: counts.reviewed },
              { id: 'quoted', label: 'Quoted', count: counts.quoted },
              { id: 'scheduled', label: 'Scheduled', count: counts.scheduled },
              { id: 'closed', label: 'Closed', count: counts.closed },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-[#390044] text-white shadow-2xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                    statusFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : tab.alert
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-zinc-200/80 text-zinc-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

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
                <option value="all">All Statuses ({counts.all})</option>
                <option value="new">Awaiting Review ({counts.new})</option>
                <option value="reviewed">Reviewed ({counts.reviewed})</option>
                <option value="quoted">Quoted ({counts.quoted})</option>
                <option value="scheduled">Scheduled ({counts.scheduled})</option>
                <option value="closed">Closed ({counts.closed})</option>
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
        <div className="bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
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
                <div className="w-12 h-12 rounded-md bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
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

      {/* Assistant Handoffs Tab (Task 2: AI Callback Management) */}
      {activeTab === 'handoffs' && (
        <div className="space-y-4">
          {handoffActionMsg && (
            <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{handoffActionMsg}</span>
              </div>
              <button onClick={() => setHandoffActionMsg(null)} className="text-emerald-700 hover:text-emerald-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Callback Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-zinc-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Customer Callback Requests</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Direct telephone or escalation requests received via the interactive assistant.
                </p>
              </div>

              {/* Status Quick Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {[
                  { id: 'all', label: 'All', count: handoffCounts.all },
                  { id: 'pending', label: 'Awaiting Contact', count: handoffCounts.pending, alert: handoffCounts.pending > 0 },
                  { id: 'contacted', label: 'Contacted', count: handoffCounts.contacted },
                  { id: 'resolved', label: 'Resolved', count: handoffCounts.resolved },
                  { id: 'dismissed', label: 'Dismissed', count: handoffCounts.dismissed },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setHandoffStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                      handoffStatusFilter === st.id
                        ? 'bg-[#390044] text-white shadow-2xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
                    }`}
                  >
                    <span>{st.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                        handoffStatusFilter === st.id
                          ? 'bg-white/20 text-white'
                          : st.alert
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-zinc-200/80 text-zinc-600'
                      }`}
                    >
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={handoffSearchQuery}
                onChange={(e) => setHandoffSearchQuery(e.target.value)}
                placeholder="Search callbacks by customer name, email, phone, location, reason..."
                className="w-full h-11 pl-10 pr-10 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-lg placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
              />
              {handoffSearchQuery && (
                <button
                  onClick={() => setHandoffSearchQuery('')}
                  className="absolute right-3 text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
              <span>
                Showing <strong className="text-zinc-900 font-semibold">{filteredHandoffs.length}</strong> of{' '}
                <strong className="text-zinc-900 font-semibold">{handoffs.length}</strong> callback requests
                {handoffStatusFilter !== 'all' || handoffSearchQuery ? ' (filtered)' : ''}
              </span>
              <span>Ottawa Dispatch Operations</span>
            </div>
          </div>

          {/* Callbacks List Container */}
          <div className="bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-zinc-100">
              {filteredHandoffs.length > 0 ? (
                filteredHandoffs.map((h) => {
                  const isUpdating = isUpdatingHandoffId === h.id;
                  return (
                    <div
                      key={h.id}
                      className="p-5 hover:bg-zinc-50/70 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                      {/* Left: Customer Info & Request Details */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-zinc-900 text-sm">
                            {h.customerName || 'Anonymous Customer'}
                          </span>
                          {renderHandoffStatusBadge(h.status)}
                          <span className="text-xs font-mono text-zinc-400">
                            #{h.id.slice(0, 8)}
                          </span>
                        </div>

                        {/* Contact details */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                          <a
                            href={`mailto:${h.customerEmail}`}
                            className="inline-flex items-center gap-1.5 text-zinc-700 hover:text-[#390044] font-medium"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#390044]" />
                            <span>{h.customerEmail}</span>
                          </a>
                          {h.customerPhone && (
                            <a
                              href={`tel:${h.customerPhone.replace(/[^0-9+]/g, '')}`}
                              className="inline-flex items-center gap-1.5 text-zinc-700 hover:text-[#FE6000] font-medium"
                            >
                              <Phone className="w-3.5 h-3.5 text-[#FE6000]" />
                              <span>{h.customerPhone}</span>
                            </a>
                          )}
                          <div className="inline-flex items-center gap-1 text-zinc-500">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{h.serviceLocation || 'Ottawa, ON'}</span>
                          </div>
                        </div>

                        {/* Services tags */}
                        {h.services && h.services.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {h.services.map((svc) => (
                              <span
                                key={svc}
                                className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 capitalize"
                              >
                                {svc}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Customer Reason / Assistant Transcript summary */}
                        <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-800 space-y-1">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                            Customer Message / Escalation Reason
                          </div>
                          <p className="text-sm text-zinc-900 leading-relaxed font-normal">
                            {h.reason}
                          </p>
                          {h.notes && (
                            <div className="pt-2 mt-2 border-t border-zinc-200/60 text-xs text-zinc-600 flex items-start gap-1.5">
                              <span className="font-semibold text-zinc-700">Staff Note:</span>
                              <span>{h.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Timestamp & Action Controls */}
                      <div className="flex flex-col md:items-end justify-between shrink-0 gap-3">
                        <div className="text-xs text-zinc-400 md:text-right">
                          <div>Received: {formatCanadianDateTime(h.createdAt)}</div>
                          {h.updatedAt && (
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              Updated: {formatCanadianDateTime(h.updatedAt)}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons for Authorized Staff */}
                        {canManageHandoffs && (
                          <div className="flex flex-wrap items-center gap-2">
                            {h.status === 'pending' && (
                              <>
                                <AdminButton
                                  variant="outline"
                                  size="sm"
                                  disabled={isUpdating}
                                  isLoading={isUpdating}
                                  onClick={() => handleUpdateHandoffStatus(h.id, 'contacted')}
                                  className="text-blue-700 border-blue-200 hover:bg-blue-50"
                                  leftIcon={<Clock className="w-3.5 h-3.5" />}
                                >
                                  Mark Contacted
                                </AdminButton>

                                <AdminButton
                                  variant="outline"
                                  size="sm"
                                  disabled={isUpdating}
                                  isLoading={isUpdating}
                                  onClick={() => handleUpdateHandoffStatus(h.id, 'resolved')}
                                  className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                  leftIcon={<Check className="w-3.5 h-3.5" />}
                                >
                                  Mark Resolved
                                </AdminButton>

                                <AdminButton
                                  variant="ghost"
                                  size="sm"
                                  disabled={isUpdating}
                                  onClick={() => openDismissDialog(h)}
                                  className="text-zinc-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  Dismiss
                                </AdminButton>
                              </>
                            )}

                            {h.status === 'contacted' && (
                              <>
                                <AdminButton
                                  variant="outline"
                                  size="sm"
                                  disabled={isUpdating}
                                  isLoading={isUpdating}
                                  onClick={() => handleUpdateHandoffStatus(h.id, 'resolved')}
                                  className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                  leftIcon={<Check className="w-3.5 h-3.5" />}
                                >
                                  Mark Resolved
                                </AdminButton>

                                <AdminButton
                                  variant="ghost"
                                  size="sm"
                                  disabled={isUpdating}
                                  onClick={() => openDismissDialog(h)}
                                  className="text-zinc-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  Dismiss
                                </AdminButton>
                              </>
                            )}

                            {(h.status === 'resolved' || h.status === 'dismissed') && (
                              <AdminButton
                                variant="outline"
                                size="sm"
                                disabled={isUpdating}
                                isLoading={isUpdating}
                                onClick={() => handleUpdateHandoffStatus(h.id, 'pending')}
                                className="text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                              >
                                Reopen
                              </AdminButton>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-md bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">No callback requests found</h3>
                    <p className="text-sm text-zinc-500 mt-1">
                      {handoffStatusFilter !== 'all' || handoffSearchQuery
                        ? 'Try clearing your search query or status filter.'
                        : 'No assistant callback requests recorded yet.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
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
              <div className="p-4 rounded-md bg-zinc-50/80 border border-zinc-200 space-y-3">
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
                  <div className="mt-3 p-4 bg-zinc-50 rounded-md border border-zinc-200 space-y-2">
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
                  <div className="p-3.5 bg-zinc-50 rounded-md border border-zinc-200 text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
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
                  <div className="p-4 rounded-md bg-zinc-50 border border-zinc-200 text-sm text-zinc-500 text-center">
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
                          className="p-5 rounded-md bg-white border border-zinc-200 shadow-sm space-y-4 transition-all"
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

      {/* Custom Confirmation Dialog for Handoff Dismissal (Task 2) */}
      <ConfirmDialog
        isOpen={dismissDialogState.isOpen}
        title="Dismiss Callback Request"
        description={`Are you sure you want to dismiss the callback request from ${dismissDialogState.customerName}? Please provide an optional reason or note for the audit log.`}
        confirmLabel="Dismiss Request"
        cancelLabel="Keep Active"
        variant="danger"
        requiresInput={true}
        inputRequired={false}
        initialInputValue={dismissDialogState.reason}
        errorMessage={dismissDialogState.errorMessage || undefined}
        inputLabel="Dismissal Note / Reason (Optional)"
        inputPlaceholder="e.g. Addressed over phone, spam, test message..."
        isLoading={dismissDialogState.isLoading}
        onConfirm={handleConfirmDismissHandoff}
        onCancel={() =>
          setDismissDialogState({
            isOpen: false,
            handoffId: null,
            customerName: '',
            reason: '',
            errorMessage: null,
            isLoading: false,
          })
        }
      />

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
