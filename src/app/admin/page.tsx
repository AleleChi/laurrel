'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  PhoneCall,
  Inbox,
} from 'lucide-react';

interface Stats {
  totalEnquiries: number;
  newEnquiries: number;
  reviewed: number;
  scheduled: number;
  failedDeliveries: number;
  pendingHandoffs: number;
}

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
  details: string;
  status: 'new' | 'reviewed' | 'quoted' | 'scheduled' | 'closed';
  emailDelivered: boolean;
  createdAt: string;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentEnquiries, setRecentEnquiries] = useState<EnquiryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const loadOverviewData = async () => {
    try {
      setRefreshing(true);
      setError('');

      const [statsRes, enqRes] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store' }),
        fetch('/api/admin/enquiries?limit=8', { cache: 'no-store' }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        const errData = await statsRes.json().catch(() => ({}));
        setError(errData.error || 'Failed to load system statistics.');
      }

      if (enqRes.ok) {
        const enqData = await enqRes.json();
        setRecentEnquiries(enqData.enquiries || []);
      }
    } catch (err: any) {
      console.error('[Overview Load Error]:', err);
      setError('Could not connect to administration backend services.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOverviewData();
  }, []);

  // Refined, subtle status presentation: minimal dot + quiet typography (no loud multi-colored badges)
  const renderStatus = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FE6000]" />
            <span>New Lead</span>
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Reviewed</span>
          </span>
        );
      case 'quoted':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-[#49056B]" />
            <span>Quoted</span>
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Scheduled</span>
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            <span>Closed</span>
          </span>
        );
      default:
        return <span className="text-xs text-zinc-500 capitalize">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Business Operations Overview
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Real-time status of inbound service requests, customer enquiries, and AI handoffs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadOverviewData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] bg-white border border-black/10 text-xs font-medium text-zinc-700 hover:bg-black/[0.02] hover:text-zinc-900 transition-colors shadow-2xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing' : 'Refresh'}</span>
          </button>

          <Link
            href="/admin/enquiries"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#49056B] text-white text-xs font-semibold hover:bg-[#5B0785] transition-all shadow-2xs"
          >
            <span>All Enquiries</span>
            <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadOverviewData}
            className="font-semibold underline hover:text-amber-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Simplified, Calm KPI Metric Row - No loud decorative circles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Recorded */}
        <div className="bg-white rounded-xl p-5 border border-black/[0.06] shadow-xs flex flex-col justify-between">
          <div className="text-xs font-medium text-zinc-500 tracking-wide uppercase">
            Total Inbound
          </div>
          <div className="my-2.5">
            <div className="text-3xl font-semibold text-zinc-900 tracking-tight">
              {loading ? '—' : stats?.totalEnquiries ?? 0}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Recorded in database</p>
          </div>
          <div className="text-[11px] text-zinc-400">All channels combined</div>
        </div>

        {/* Metric 2: Action Required */}
        <div className="bg-white rounded-xl p-5 border border-black/[0.06] shadow-xs flex flex-col justify-between border-l-3 border-l-[#FE6000]">
          <div className="text-xs font-medium text-[#FE6000] tracking-wide uppercase">
            Action Required
          </div>
          <div className="my-2.5">
            <div className="text-3xl font-semibold text-[#FE6000] tracking-tight">
              {loading ? '—' : stats?.newEnquiries ?? 0}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">Awaiting first review</p>
          </div>
          <div className="text-[11px] text-zinc-400">&lt; 2-hour response goal</div>
        </div>

        {/* Metric 3: Pipeline */}
        <div className="bg-white rounded-xl p-5 border border-black/[0.06] shadow-xs flex flex-col justify-between">
          <div className="text-xs font-medium text-zinc-500 tracking-wide uppercase">
            In Pipeline
          </div>
          <div className="my-2.5">
            <div className="text-3xl font-semibold text-zinc-900 tracking-tight">
              {loading ? '—' : (stats?.reviewed ?? 0) + (stats?.scheduled ?? 0)}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Reviewed or scheduled</p>
          </div>
          <div className="text-[11px] text-zinc-400">
            {stats?.reviewed ?? 0} reviewed • {stats?.scheduled ?? 0} scheduled
          </div>
        </div>

        {/* Metric 4: AI Escalations */}
        <div className="bg-white rounded-xl p-5 border border-black/[0.06] shadow-xs flex flex-col justify-between">
          <div className="text-xs font-medium text-zinc-500 tracking-wide uppercase">
            Assistant Handoffs
          </div>
          <div className="my-2.5">
            <div className="text-3xl font-semibold text-zinc-900 tracking-tight">
              {loading ? '—' : stats?.pendingHandoffs ?? 0}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Chat requests for callback</p>
          </div>
          <div className="text-[11px] text-zinc-400">Direct human escalation</div>
        </div>
      </div>

      {/* Executive Operational Overview - Coherent control surface, no boxes inside boxes */}
      <div className="bg-white rounded-xl border border-black/[0.06] shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Operational Priority Checklist</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Key daily touchpoints requiring lead coordinator response.</p>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium">Daily Target: 100% Qualified</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black/[0.06] pt-4">
          {/* Column 1 */}
          <div className="py-3 md:py-0 md:pr-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-800">Unreviewed Inquiries</span>
              <span className="text-xs font-bold text-[#FE6000]">{stats?.newEnquiries ?? 0}</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {(stats?.newEnquiries ?? 0) > 0
                ? `${stats?.newEnquiries} customer lead(s) require qualification and estimate dispatch.`
                : 'All inbound quote requests have been reviewed and processed.'}
            </p>
            <Link
              href="/admin/enquiries?status=new"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#49056B] hover:text-[#5B0785] mt-2.5 transition-colors"
            >
              <span>Review pending leads</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Column 2 */}
          <div className="py-3 md:py-0 md:px-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-800">AI Assistant Escalations</span>
              <span className="text-xs font-bold text-zinc-900">{stats?.pendingHandoffs ?? 0}</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {(stats?.pendingHandoffs ?? 0) > 0
                ? `${stats?.pendingHandoffs} visitor chat session(s) escalated to human callback.`
                : 'No pending AI chat escalations requiring telephone follow-up.'}
            </p>
            <Link
              href="/admin/enquiries"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#49056B] hover:text-[#5B0785] mt-2.5 transition-colors"
            >
              <span>View handoff requests</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Column 3 */}
          <div className="py-3 md:py-0 md:pl-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-800">Dispatch Notification Health</span>
              <span className="text-xs font-medium text-emerald-600">Active</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {(stats?.failedDeliveries ?? 0) === 0
                ? 'Outbound email notifications operational. Zero delivery failures logged.'
                : `${stats?.failedDeliveries} notification delivery warnings recorded.`}
            </p>
            <span className="inline-block text-[11px] text-zinc-400 mt-2.5">
              Automated logging enabled
            </span>
          </div>
        </div>
      </div>

      {/* Recent Enquiries Table - Editorial, calm typography */}
      <div className="bg-white rounded-xl border border-black/[0.06] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Recent Customer Inquiries</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Latest submissions received via website estimate forms and contact routes.
            </p>
          </div>
          <Link
            href="/admin/enquiries"
            className="text-xs font-semibold text-[#49056B] hover:text-[#5B0785] inline-flex items-center gap-1 transition-colors"
          >
            <span>View All ({stats?.totalEnquiries ?? 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50/60 border-b border-black/[0.06] text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-6">Reference</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Services</th>
                <th className="py-3 px-6">Location</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {recentEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-400">
                    {loading ? 'Loading records...' : 'No enquiries found.'}
                  </td>
                </tr>
              ) : (
                recentEnquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-zinc-500 text-[11px]">
                      <div className="font-semibold text-zinc-900">{enq.id}</div>
                      <div className="text-zinc-400 text-[10px]">
                        {new Date(enq.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-medium text-zinc-900">{enq.customer.name}</div>
                      <div className="text-zinc-400 text-[11px]">{enq.customer.email}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex flex-wrap gap-1">
                        {enq.services.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-md bg-zinc-100 text-[11px] font-medium text-zinc-600 capitalize"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-zinc-600">
                      {enq.serviceLocation || 'Ottawa, ON'}
                    </td>
                    <td className="py-3.5 px-6">
                      {renderStatus(enq.status)}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        href={`/admin/enquiries?id=${enq.id}`}
                        className="px-3 py-1 rounded-[8px] bg-zinc-100 hover:bg-[#49056B] hover:text-white text-xs font-medium text-zinc-700 transition-colors"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
