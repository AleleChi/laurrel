'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Inbox,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  MessageSquare,
  Sparkles,
  ChevronRight,
  X,
  Send,
  ExternalLink,
} from 'lucide-react';

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

  const statusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-100 text-[#FE6000] border border-[#FE6000]/20">
            New Lead
          </span>
        );
      case 'reviewed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
            Reviewed
          </span>
        );
      case 'quoted':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-[#49056B] border border-[#49056B]/20">
            Quoted
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            Scheduled
          </span>
        );
      case 'closed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
            Closed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#49056B] tracking-tight">
            Customer Enquiries & Handoffs
          </h1>
          <p className="text-xs sm:text-sm text-[#575757] mt-1">
            Manage incoming cleaning, moving, and storage quote requests and AI escalations.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-black/10 shadow-xs self-start">
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'enquiries'
                ? 'bg-[#49056B] text-white shadow-2xs'
                : 'text-[#575757] hover:text-[#202024]'
            }`}
          >
            Inbound Enquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('handoffs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'handoffs'
                ? 'bg-[#49056B] text-white shadow-2xs'
                : 'text-[#575757] hover:text-[#202024]'
            }`}
          >
            AI Escalations ({handoffs.length})
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-black/[0.08] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, email, phone, location or ID..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#F8F7F4] border border-black/15 rounded-xl text-xs text-[#202024] placeholder:text-[#888] focus:outline-none focus:ring-2 focus:ring-[#49056B]"
            />
            <Search className="w-4 h-4 text-[#888] absolute left-3 top-3" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-[#F8F7F4] border border-black/15 rounded-xl text-xs font-semibold text-[#202024] focus:outline-none focus:ring-2 focus:ring-[#49056B]"
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
              className="px-3 py-2.5 bg-[#F8F7F4] border border-black/15 rounded-xl text-xs font-semibold text-[#202024] focus:outline-none focus:ring-2 focus:ring-[#49056B]"
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
              className="p-2.5 rounded-xl bg-[#F8F7F4] border border-black/15 text-[#575757] hover:text-[#49056B] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#49056B]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table + Detail Modal */}
      {activeTab === 'enquiries' ? (
        <div className="bg-white rounded-3xl border border-black/[0.08] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8F7F4]/80 border-b border-black/[0.06] text-[#888] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Reference</th>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Services</th>
                  <th className="py-3.5 px-5">Location</th>
                  <th className="py-3.5 px-5">Preferred Timing</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {loading && enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#888]">
                      Loading records from Neon PostgreSQL...
                    </td>
                  </tr>
                ) : filteredEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#888]">
                      No customer enquiries matched your search filters.
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
                          isSelected ? 'bg-[#49056B]/[0.05]' : 'hover:bg-[#F8F7F4]/60'
                        }`}
                      >
                        <td className="py-3.5 px-5 font-mono text-[11px] text-[#575757]">
                          <div className="font-bold text-[#202024]">{enq.id}</div>
                          <div>{new Date(enq.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-[#202024]">{enq.customer.name}</div>
                          <div className="text-[#888] text-[11px]">{enq.customer.email}</div>
                          {enq.customer.phone && (
                            <div className="text-[#888] text-[11px]">{enq.customer.phone}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex flex-wrap gap-1">
                            {enq.services.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded bg-black/[0.04] text-[10px] font-semibold text-[#575757] capitalize"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-[#575757]">
                          {enq.serviceLocation || 'Ottawa, ON'}
                        </td>
                        <td className="py-3.5 px-5 text-[#575757]">
                          {enq.preferredTiming || 'Flexible'}
                        </td>
                        <td className="py-3.5 px-5">
                          {statusBadge(enq.status)}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEnquiry(enq);
                            }}
                            className="px-3 py-1 rounded-lg bg-white border border-black/10 text-xs font-bold text-[#49056B] hover:bg-[#49056B] hover:text-white transition-all shadow-2xs"
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
        /* AI Escalations Tab */
        <div className="bg-white rounded-3xl border border-black/[0.08] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8F7F4]/80 border-b border-black/[0.06] text-[#888] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">ID & Date</th>
                  <th className="py-3.5 px-5">Customer Contact</th>
                  <th className="py-3.5 px-5">Escalation Reason</th>
                  <th className="py-3.5 px-5">Services</th>
                  <th className="py-3.5 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {handoffs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#888]">
                      No AI human handoff escalations on record.
                    </td>
                  </tr>
                ) : (
                  handoffs.map((h) => (
                    <tr key={h.id} className="hover:bg-[#F8F7F4]/60 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-[11px] text-[#575757]">
                        <div className="font-bold text-[#202024]">{h.id}</div>
                        <div>{new Date(h.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-[#202024]">
                          {h.customerName || 'Laurrel Visitor'}
                        </div>
                        <div className="text-[#888] text-[11px]">{h.customerEmail}</div>
                        {h.customerPhone && (
                          <div className="text-[#888] text-[11px]">{h.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 max-w-xs text-[#575757]">
                        {h.reason}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex flex-wrap gap-1">
                          {(h.services || ['general']).map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded bg-black/[0.04] text-[10px] font-semibold text-[#575757] capitalize"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-100 text-[#FE6000]">
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

      {/* Detail Slide-Over Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l border-black/10 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-black/[0.08] flex items-center justify-between bg-[#F8F7F4]/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#49056B]">
                    {selectedEnquiry.id}
                  </span>
                  {statusBadge(selectedEnquiry.status)}
                </div>
                <p className="text-[11px] text-[#888] mt-0.5">
                  Received {new Date(selectedEnquiry.createdAt).toLocaleString()} via{' '}
                  <span className="font-semibold">{selectedEnquiry.source}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-2 rounded-xl text-[#888] hover:bg-black/5 hover:text-[#202024] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Contact */}
              <div className="bg-[#F8F7F4] rounded-2xl p-4 border border-black/[0.06] space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#888]">
                  Customer Contact Details
                </p>
                <p className="text-base font-bold text-[#202024]">{selectedEnquiry.customer.name}</p>
                <div className="flex flex-col gap-1 text-xs text-[#575757]">
                  <a
                    href={`mailto:${selectedEnquiry.customer.email}`}
                    className="flex items-center gap-2 hover:text-[#49056B] font-medium"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#FE6000]" />
                    <span>{selectedEnquiry.customer.email}</span>
                  </a>
                  {selectedEnquiry.customer.phone && (
                    <a
                      href={`tel:${selectedEnquiry.customer.phone}`}
                      className="flex items-center gap-2 hover:text-[#49056B] font-medium"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#49056B]" />
                      <span>{selectedEnquiry.customer.phone}</span>
                    </a>
                  )}
                  {selectedEnquiry.serviceLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#888]" />
                      <span>Location: {selectedEnquiry.serviceLocation}</span>
                    </div>
                  )}
                  {selectedEnquiry.preferredTiming && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#888]" />
                      <span>Preferred Date/Timing: {selectedEnquiry.preferredTiming}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Details & Notes */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#888] mb-2">
                  Service Request Details
                </p>
                <div className="p-4 rounded-2xl bg-white border border-black/10 text-xs text-[#202024] leading-relaxed">
                  {selectedEnquiry.details}
                </div>
              </div>

              {/* Structured Service Data (if any) */}
              {selectedEnquiry.serviceDetails && Object.keys(selectedEnquiry.serviceDetails).length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#888] mb-2">
                    Property / Quote Parameters
                  </p>
                  <pre className="p-3 rounded-2xl bg-[#F8F7F4] border border-black/[0.06] text-[11px] font-mono text-[#575757] overflow-x-auto">
                    {JSON.stringify(selectedEnquiry.serviceDetails, null, 2)}
                  </pre>
                </div>
              )}

              {/* Status Transition Control */}
              <div className="bg-[#F8F7F4] rounded-2xl p-4 border border-black/[0.06] space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#888]">
                  Update Lead Pipeline Status
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {(['new', 'reviewed', 'quoted', 'scheduled', 'closed'] as const).map((s) => (
                    <button
                      key={s}
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusUpdate(s)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        selectedEnquiry.status === s
                          ? 'bg-[#49056B] text-white shadow-xs'
                          : 'bg-white border border-black/10 text-[#575757] hover:border-[#49056B]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {statusError && (
                  <p className="text-xs text-red-600 font-semibold">{statusError}</p>
                )}
              </div>

              {/* Internal Notes History */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#888]">
                  Internal Operations Notes ({selectedEnquiry.internalNotes?.length || 0})
                </p>

                <div className="space-y-2">
                  {selectedEnquiry.internalNotes && selectedEnquiry.internalNotes.length > 0 ? (
                    selectedEnquiry.internalNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl bg-white border border-black/10 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#888]">
                          <span className="font-bold text-[#49056B]">{note.author}</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-[#202024]">{note.note}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#888] italic">No internal notes recorded yet.</p>
                  )}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNoteOnly} className="space-y-2 pt-2">
                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add an internal operations note (e.g. called customer, quoted $450, awaiting confirmation)..."
                    className="w-full p-3 bg-white border border-black/15 rounded-xl text-xs text-[#202024] focus:outline-none focus:ring-2 focus:ring-[#49056B]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingStatus || !newNoteText.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#49056B] text-white text-xs font-bold hover:bg-[#49056B]/90 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-3 h-3 text-[#FE6000]" />
                      <span>Append Note</span>
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
