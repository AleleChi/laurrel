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
} from '@/lib/utils/formatters';

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

  const [loading, setLoading] = useState<boolean>(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [statusError, setStatusError] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [enqRes, handoffsRes] = await Promise.all([
        fetch('/api/admin/enquiries?limit=200', { cache: 'no-store' }),
        fetch('/api/admin/handoffs', { cache: 'no-store' }),
      ]);

      if (enqRes.ok) {
        const enqData = await enqRes.json();
        const list: EnquiryItem[] = enqData.enquiries || [];
        setEnquiries(list);

        if (initialEnquiryId) {
          const match = list.find((e) => e.id === initialEnquiryId);
          if (match) setSelectedEnquiry(match);
        } else if (selectedEnquiry) {
          const updated = list.find((e) => e.id === selectedEnquiry.id);
          if (updated) setSelectedEnquiry(updated);
        }
      }

      if (handoffsRes.ok) {
        const hData = await handoffsRes.json();
        setHandoffs(hData.handoffs || []);
      }
    } catch (err) {
      console.error('[Enquiries Page Load Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  // Clean, restrained status presentation without decorative dots or badge-heavy styling
  const renderStatus = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="text-xs font-semibold text-[#FE6000]">New Lead</span>;
      case 'reviewed':
        return <span className="text-xs font-medium text-zinc-700">Reviewed</span>;
      case 'quoted':
        return <span className="text-xs font-medium text-[#49056B]">Quoted</span>;
      case 'scheduled':
        return <span className="text-xs font-medium text-emerald-700">Scheduled</span>;
      case 'closed':
        return <span className="text-xs text-zinc-400">Closed</span>;
      default:
        return <span className="text-xs text-zinc-500 capitalize">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & View Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Customer Enquiries & Dispatch
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Review inbound quote requests, qualify leads, and manage customer communications.
          </p>
        </div>

        <div className="flex items-center p-1 bg-zinc-200/60 rounded-[10px] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'enquiries'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Inbound Enquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('handoffs')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'handoffs'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Callback Requests ({handoffs.length})
          </button>
        </div>
      </div>

      {/* Filter & Search Bar - Clean, calm, restrained */}
      <div className="bg-white rounded-xl p-3.5 border border-black/[0.06] shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, email, phone, location or ID..."
              className="w-full pl-9 pr-4 py-2 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:border-transparent transition-all"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="px-3 py-2 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
            >
              <option value="all">All Statuses</option>
              <option value="new">New Leads</option>
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
              className="px-3 py-2 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
            >
              <option value="all">All Services</option>
              <option value="cleaning">Cleaning</option>
              <option value="moving">Moving</option>
              <option value="storage">Storage</option>
              <option value="general">General</option>
            </select>

            <button
              onClick={loadData}
              title="Refresh"
              aria-label="Refresh data"
              className="p-2 rounded-[10px] bg-[#F8F7F4] border border-black/10 text-zinc-500 hover:text-[#49056B] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#49056B]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'enquiries' ? (
        <div className="bg-white rounded-xl border border-black/[0.06] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50/60 border-b border-black/[0.06] text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Reference</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Services</th>
                  <th className="py-3 px-6">Location</th>
                  <th className="py-3 px-6">Preferred Timing</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {loading && enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      <div className="flex flex-col items-center justify-center gap-2.5" role="status" aria-busy="true">
                        <div className="relative w-6 h-6 motion-safe:animate-pulse">
                          <Image
                            src="/assets/brand/laurrel-symbol.png"
                            alt="Loading"
                            fill
                            sizes="24px"
                            className="object-contain"
                          />
                        </div>
                        <span className="text-xs text-zinc-400 font-medium tracking-wide">
                          Loading records from database...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      No customer enquiries matched your search criteria.
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
                          isSelected ? 'bg-[#49056B]/[0.04]' : 'hover:bg-zinc-50/60'
                        }`}
                      >
                        <td className="py-3.5 px-6 text-[11px] text-zinc-500">
                          <div className="font-semibold text-zinc-900 tracking-tight">{enq.id}</div>
                          <div className="text-zinc-500 text-[10px]">
                            {formatCanadianDate(enq.createdAt)} · {formatEnquirySource(enq.source)}
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="font-medium text-zinc-900">{enq.customer.name}</div>
                          <div className="text-zinc-400 text-[11px]">{enq.customer.email}</div>
                          {enq.customer.phone && (
                            <div className="text-zinc-400 text-[11px]">{enq.customer.phone}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="text-xs text-zinc-700 capitalize font-medium">
                            {enq.services.join(' • ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-zinc-600">
                          {enq.serviceLocation || 'Ottawa Area'}
                        </td>
                        <td className="py-3.5 px-6 text-zinc-600">
                          {enq.preferredTiming || 'Flexible'}
                        </td>
                        <td className="py-3.5 px-6">
                          {renderStatus(enq.status)}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEnquiry(enq);
                            }}
                            className="inline-flex items-center text-xs font-semibold text-[#49056B] hover:text-[#FE6000] transition-colors"
                          >
                            Inspect
                          </button>
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
        <div className="bg-white rounded-xl border border-black/[0.06] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50/60 border-b border-black/[0.06] text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Reference</th>
                  <th className="py-3 px-6">Customer Contact</th>
                  <th className="py-3 px-6">Callback Details</th>
                  <th className="py-3 px-6">Services</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {handoffs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400">
                      No customer callback requests on record.
                    </td>
                  </tr>
                ) : (
                  handoffs.map((h) => (
                    <tr key={h.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-6 text-[11px] text-zinc-500">
                        <div className="font-semibold text-zinc-900 tracking-tight">{h.id}</div>
                        <div className="text-zinc-500 text-[10px]">
                          {formatCanadianDate(h.createdAt)}
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-medium text-zinc-900">
                          {h.customerName || 'Laurrel Visitor'}
                        </div>
                        <div className="text-zinc-400 text-[11px]">{h.customerEmail}</div>
                        {h.customerPhone && (
                          <div className="text-zinc-400 text-[11px]">{h.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-6 max-w-sm text-zinc-600">
                        {h.reason}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="text-xs text-zinc-700 capitalize font-medium">
                          {(h.services || ['general']).join(' • ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="text-xs font-medium text-zinc-700 capitalize">
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

      {/* Refined CRM Slide-Over Drawer - No heavy boxed fragments, clean typographic structure */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col border-l border-black/[0.08] overflow-hidden">
            {/* Drawer Header */}
            <div className="px-6 py-4.5 border-b border-black/[0.06] flex items-center justify-between bg-zinc-50/60">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-zinc-900 tracking-tight">
                    {selectedEnquiry.id}
                  </span>
                  {renderStatus(selectedEnquiry.status)}
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {formatEnquiryReceivedHeader(selectedEnquiry.createdAt, selectedEnquiry.source)}
                </p>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* 1. Customer Name and Contact */}
              <div className="space-y-3 pb-5 border-b border-black/[0.06]">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Customer Contact
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                    {selectedEnquiry.customer.name}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <a
                    href={`mailto:${selectedEnquiry.customer.email}`}
                    className="inline-flex items-center gap-2 text-zinc-700 hover:text-[#49056B] transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{selectedEnquiry.customer.email}</span>
                  </a>

                  {selectedEnquiry.customer.phone && (
                    <a
                      href={`tel:${selectedEnquiry.customer.phone}`}
                      className="inline-flex items-center gap-2 text-zinc-700 hover:text-[#49056B] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>{selectedEnquiry.customer.phone}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* 2. Requested Services */}
              <div className="space-y-3 pb-5 border-b border-black/[0.06]">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Requested Services
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEnquiry.services.map((svc) => (
                    <span
                      key={svc}
                      className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 text-xs font-semibold capitalize"
                    >
                      {svc}
                    </span>
                  ))}
                </div>

                {/* Service-Specific Parameters (Human Readable) */}
                {selectedEnquiry.serviceDetails && Object.keys(selectedEnquiry.serviceDetails).length > 0 && (
                  <div className="mt-3 p-3.5 bg-zinc-50/80 rounded-[10px] border border-black/[0.06] space-y-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Service Scope & Details
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
                                <span className="text-zinc-800 font-medium text-xs block">
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
                              <span className="text-zinc-800 font-medium text-xs block">
                                {formatServiceParamValue(catVal)}
                              </span>
                            </div>,
                          ];
                        }
                        return [];
                      })}
                    </div>

                    {/* Diagnostic toggle */}
                    <details className="mt-3 pt-2 border-t border-black/[0.04] text-[10px] text-zinc-400">
                      <summary className="cursor-pointer hover:text-zinc-600 transition-colors">
                        Technical Payload (Diagnostic)
                      </summary>
                      <pre className="mt-1.5 p-2 bg-white rounded border border-black/[0.06] font-mono text-[10px] overflow-x-auto text-zinc-600">
                        {JSON.stringify(selectedEnquiry.serviceDetails, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>

              {/* 3. Service Location & Preferred Timing */}
              <div className="space-y-3 pb-5 border-b border-black/[0.06]">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Service Location & Timing
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="inline-flex items-center gap-2 text-zinc-700">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{selectedEnquiry.serviceLocation || 'Ottawa, ON Area'}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 text-zinc-700">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{selectedEnquiry.preferredTiming || 'Flexible schedule'}</span>
                  </div>
                </div>
              </div>

              {/* 4. Request Details */}
              <div className="space-y-2 pb-5 border-b border-black/[0.06]">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Customer Notes & Requirements
                </div>
                <div className="border-l-2 border-[#49056B]/40 pl-3.5 py-0.5 text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                  {selectedEnquiry.details || 'No additional details provided.'}
                </div>
              </div>

              {/* 5. Appointments & Meeting Scheduling */}
              <div className="space-y-2.5 pb-5 border-b border-black/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                    Appointments & Consultations
                  </div>
                  <span className="text-[11px] text-zinc-400">Ottawa Local Time</span>
                </div>

                <div className="p-3.5 rounded-[10px] bg-zinc-50 border border-black/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CalendarPlus className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs text-zinc-600">No appointment scheduled</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      alert('Phase B consultation scheduling will open the appointment booking interface.');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#49056B] text-white text-xs font-semibold hover:bg-[#5B0785] transition-all shadow-2xs"
                  >
                    <span>Schedule Meeting</span>
                  </button>
                </div>
              </div>

              {/* 6. Lead Status Pipeline Transition Control */}
              <div className="space-y-2 pb-5 border-b border-black/[0.06]">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Lead Status Pipeline
                </div>
                <div className="grid grid-cols-5 p-1 bg-zinc-100 rounded-[10px] gap-1">
                  {(['new', 'reviewed', 'quoted', 'scheduled', 'closed'] as const).map((s) => (
                    <button
                      key={s}
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusUpdate(s)}
                      className={`py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                        selectedEnquiry.status === s
                          ? 'bg-[#49056B] text-white shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {statusError && (
                  <p className="text-xs text-red-600 font-medium">{statusError}</p>
                )}
              </div>

              {/* 7. Activity & Notes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                    Activity & Notes
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">
                    {selectedEnquiry.internalNotes?.length || 0}{' '}
                    {selectedEnquiry.internalNotes?.length === 1 ? 'note' : 'notes'}
                  </span>
                </div>

                {/* Timeline Entries */}
                <div className="space-y-3 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-200">
                  {selectedEnquiry.internalNotes && selectedEnquiry.internalNotes.length > 0 ? (
                    selectedEnquiry.internalNotes.map((note) => (
                      <div key={note.id} className="relative space-y-1">
                        <div className="absolute -left-4 top-1.5 w-2 h-2 rounded-full bg-zinc-300 ring-4 ring-white" />
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-zinc-800">
                            {formatNoteAuthor(note.author)}
                          </span>
                          <span className="text-zinc-400 text-[10px]">
                            {formatCanadianDateTime(note.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 leading-relaxed">
                          {formatNoteContent(note.note)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No notes recorded yet.</p>
                  )}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNoteOnly} className="space-y-2 pt-3">
                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Record customer contact, estimated hours, or dispatch instructions..."
                    className="w-full p-2.5 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:border-transparent transition-all"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingStatus || !newNoteText.trim()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#49056B] text-white text-xs font-semibold hover:bg-[#5B0785] disabled:opacity-50 transition-all shadow-2xs"
                    >
                      <Send className="w-3 h-3 text-orange-400" />
                      <span>Save Note</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
