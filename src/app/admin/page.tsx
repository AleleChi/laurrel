'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  PhoneCall,
  Calendar,
  Layers,
  ShieldCheck,
  ExternalLink,
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
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#49056B] tracking-tight">
            Business Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#575757] mt-1">
            Real-time status of inbound service requests, customer enquiries, and AI handoffs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadOverviewData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-black/10 text-xs font-bold text-[#202024] hover:bg-[#F8F7F4] transition-colors shadow-xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#49056B] ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>

          <Link
            href="/admin/enquiries"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#49056B] text-white text-xs font-bold hover:bg-[#49056B]/90 transition-all shadow-xs"
          >
            <span>Manage All Enquiries</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#FE6000]" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadOverviewData}
            className="font-bold underline hover:text-amber-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#888]">
              Total Enquiries
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#49056B]/[0.08] text-[#49056B] flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#202024]">
              {loading ? '—' : stats?.totalEnquiries ?? 0}
            </div>
            <p className="text-[11px] text-[#888] mt-1">Recorded in Neon database</p>
          </div>
        </div>

        {/* Metric 2: New Enquiries */}
        <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FE6000]">
              Action Required
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FE6000] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#FE6000]">
              {loading ? '—' : stats?.newEnquiries ?? 0}
            </div>
            <p className="text-[11px] text-[#888] mt-1">Unreviewed customer leads</p>
          </div>
        </div>

        {/* Metric 3: Reviewed & Scheduled */}
        <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#888]">
              In Pipeline
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#202024]">
              {loading ? '—' : (stats?.reviewed ?? 0) + (stats?.scheduled ?? 0)}
            </div>
            <p className="text-[11px] text-[#888] mt-1">
              {stats?.reviewed ?? 0} reviewed • {stats?.scheduled ?? 0} scheduled
            </p>
          </div>
        </div>

        {/* Metric 4: AI Escalations */}
        <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#888]">
              AI Human Handoffs
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#49056B] flex items-center justify-center">
              <PhoneCall className="w-4 h-4 text-[#FE6000]" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#49056B]">
              {loading ? '—' : stats?.pendingHandoffs ?? 0}
            </div>
            <p className="text-[11px] text-[#888] mt-1">Visitor requested direct callback</p>
          </div>
        </div>
      </div>

      {/* Operational Attention Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-black/[0.08] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#FE6000]" />
            <h2 className="text-base font-extrabold text-[#49056B]">
              Operational Attention Checklist
            </h2>
          </div>
          <span className="text-xs text-[#888] font-medium">Daily Lead SLA: &lt; 2 Hours</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#F8F7F4] border border-black/[0.05]">
            <p className="text-xs font-bold text-[#202024] mb-1">New Unreviewed Requests</p>
            <p className="text-xs text-[#575757] leading-relaxed">
              {(stats?.newEnquiries ?? 0) > 0 ? (
                <>
                  <span className="font-bold text-[#FE6000]">{stats?.newEnquiries}</span> customer
                  enquir{stats?.newEnquiries === 1 ? 'y' : 'ies'} awaiting review and quote preparation.
                </>
              ) : (
                'All inbound enquiries have been reviewed. Excellent response time!'
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F7F4] border border-black/[0.05]">
            <p className="text-xs font-bold text-[#202024] mb-1">AI Assistant Escalations</p>
            <p className="text-xs text-[#575757] leading-relaxed">
              {(stats?.pendingHandoffs ?? 0) > 0 ? (
                <>
                  <span className="font-bold text-[#49056B]">{stats?.pendingHandoffs}</span> customer
                  chat session(s) escalated to human dispatch.
                </>
              ) : (
                'No pending chat handoffs awaiting customer contact.'
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F7F4] border border-black/[0.05]">
            <p className="text-xs font-bold text-[#202024] mb-1">Notification Delivery Status</p>
            <p className="text-xs text-[#575757] leading-relaxed">
              {(stats?.failedDeliveries ?? 0) === 0 ? (
                <span className="text-emerald-700 font-medium">
                  ✓ 100% dispatch delivery health. Zero outbound notification failures.
                </span>
              ) : (
                <span className="text-red-700 font-bold">
                  {stats?.failedDeliveries} email delivery alert(s) logged.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-3xl border border-black/[0.08] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-black/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#49056B]">Recent Inbound Enquiries</h2>
            <p className="text-xs text-[#575757] mt-0.5">
              Latest service requests received through website quote forms and contact channels.
            </p>
          </div>
          <Link
            href="/admin/enquiries"
            className="text-xs font-bold text-[#49056B] hover:text-[#FE6000] inline-flex items-center gap-1 transition-colors"
          >
            <span>View All ({stats?.totalEnquiries ?? 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F7F4]/80 border-b border-black/[0.06] text-[#888] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-5">ID & Date</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Services Requested</th>
                <th className="py-3 px-5">Location</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {recentEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#888]">
                    {loading ? 'Loading customer records from Neon...' : 'No customer enquiries found.'}
                  </td>
                </tr>
              ) : (
                recentEnquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-[#F8F7F4]/50 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-[11px] text-[#575757]">
                      <div className="font-bold text-[#202024]">{enq.id}</div>
                      <div>{new Date(enq.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-[#202024]">{enq.customer.name}</div>
                      <div className="text-[#888] text-[11px]">{enq.customer.email}</div>
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
                      {enq.serviceLocation || 'Ottawa Area'}
                    </td>
                    <td className="py-3.5 px-5">
                      {statusBadge(enq.status)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/admin/enquiries?id=${enq.id}`}
                        className="px-2.5 py-1 rounded-lg bg-white border border-black/10 text-[11px] font-bold text-[#49056B] hover:bg-[#49056B] hover:text-white transition-all shadow-2xs"
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
