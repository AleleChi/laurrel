'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock,
  PhoneCall,
  Inbox,
  CalendarDays,
  ExternalLink,
  ChevronRight,
  User,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  formatCanadianDate,
  formatOttawaDate,
  formatOttawaTime,
  formatAppointmentType,
  formatAppointmentStatus,
} from '@/lib/utils/formatters';

interface TimelinePoint {
  period: string;
  count: number;
}

interface ServiceBreakdownItem {
  service: string;
  count: number;
}

interface StatusBreakdownItem {
  status: string;
  count: number;
}

interface Stats {
  totalEnquiries: number;
  newEnquiries: number;
  reviewed: number;
  scheduled: number;
  failedDeliveries: number;
  pendingHandoffs: number;
  upcomingAppointments: number;
  todayAppointments: number;
  timeline?: TimelinePoint[];
  servicesBreakdown?: ServiceBreakdownItem[];
  statusBreakdown?: StatusBreakdownItem[];
}

interface AppointmentItem {
  id: string;
  enquiryId: string;
  title: string;
  customerName: string;
  customerEmail: string;
  scheduledStart: string;
  scheduledEnd: string;
  durationMinutes: number;
  appointmentType: string;
  status: string;
  assignedStaffName?: string | null;
  locationOrLink?: string | null;
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
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadOverviewData = async () => {
    try {
      setRefreshing(true);
      setError('');

      const [statsRes, enqRes, aptRes] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store' }),
        fetch('/api/admin/enquiries?limit=8', { cache: 'no-store' }),
        fetch('/api/admin/appointments?limit=5', { cache: 'no-store' }),
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

      if (aptRes.ok) {
        const aptData = await aptRes.json();
        setUpcomingAppointments(aptData.appointments || []);
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

  const renderStatusBadge = (status: string) => {
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

  // Format Timeline points for chart display
  const timelineChartData = (stats?.timeline || []).map((t) => {
    try {
      const parts = t.period.split('-');
      const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return {
        label: date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
        count: t.count,
        rawDate: t.period,
      };
    } catch {
      return { label: t.period, count: t.count, rawDate: t.period };
    }
  });

  const serviceChartData = (stats?.servicesBreakdown || []).map((s) => ({
    name: s.service.charAt(0).toUpperCase() + s.service.slice(1),
    count: s.count,
  }));

  const SERVICE_COLORS: Record<string, string> = {
    Moving: '#49056B',
    Cleaning: '#FE6000',
    Storage: '#2563EB',
    General: '#6B7280',
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header (Canadian Business Restraint) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Overview
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Operations summary and active customer dispatch for Ottawa, Ontario.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadOverviewData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-zinc-200/80 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadOverviewData}
            className="text-amber-800 font-semibold underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. TOP PERFORMANCE SUMMARY — Compact, Sophisticated KPI Panels (WowDash Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Enquiries */}
        <div className="bg-white p-4 rounded-md border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Total Inbound Enquiries
            </span>
            <div className="w-8 h-8 rounded-md bg-zinc-100 text-zinc-600 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 tracking-tight">
            {stats ? stats.totalEnquiries : '—'}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            All-time customer quote requests
          </p>
        </div>

        {/* KPI 2: Awaiting Review */}
        <div className="bg-white p-4 rounded-md border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Awaiting Review
            </span>
            <div className="w-8 h-8 rounded-md bg-orange-50 text-[#FE6000] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#FE6000] tracking-tight">
            {stats ? stats.newEnquiries : '—'}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            New leads requiring coordinator review
          </p>
        </div>

        {/* KPI 3: Upcoming Consultations */}
        <div className="bg-white p-4 rounded-md border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Upcoming Consultations
            </span>
            <div className="w-8 h-8 rounded-md bg-purple-50 text-[#49056B] flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#49056B] tracking-tight">
            {stats ? stats.upcomingAppointments : '—'}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Scheduled consultations in Ottawa
          </p>
        </div>

        {/* KPI 4: Callback Requests */}
        <div className="bg-white p-4 rounded-md border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Callback Requests
            </span>
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 tracking-tight">
            {stats ? stats.pendingHandoffs : '—'}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Customer phone callbacks requested
          </p>
        </div>
      </div>

      {/* 2. MIDDLE OPERATIONAL REPORTING — Primary Chart Area (Real Authenticated Data) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart: Inbound Activity Timeline (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-md border border-zinc-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Enquiry Activity Over Time</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Verified daily volume of customer enquiries across Ottawa
              </p>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
              Last 60 Days
            </span>
          </div>

          <div className="h-64 w-full">
            {mounted && timelineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#49056B" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#49056B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="label"
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E7EB',
                      borderRadius: '6px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    }}
                    labelStyle={{ fontWeight: 600, color: '#111827' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#49056B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#purpleGradient)"
                    name="Enquiries"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                {loading ? 'Loading enquiry activity...' : 'No historical enquiry activity recorded in this period.'}
              </div>
            )}
          </div>
        </div>

        {/* Secondary Chart: Service Demand Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-md border border-zinc-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-900">Service Demand</h2>
              <span className="text-[11px] font-medium text-zinc-400">By Service Type</span>
            </div>

            {serviceChartData.length > 0 ? (
              <div className="space-y-3.5 my-2">
                {serviceChartData.map((item) => {
                  const total = stats?.totalEnquiries || 1;
                  const pct = Math.round((item.count / total) * 100);
                  const color = SERVICE_COLORS[item.name] || '#6B7280';
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-800">{item.name}</span>
                        <span className="text-zinc-500 font-medium">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded bg-zinc-100 overflow-hidden">
                        <div
                          className="h-full rounded"
                          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-zinc-400">
                {loading ? 'Loading service breakdown...' : 'No service data available.'}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Primary Focus: Ottawa & Region</span>
            <Link
              href="/admin/enquiries"
              className="text-[#49056B] font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>View Enquiries</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ACTIONABLE WORK — CRM Data Table & Upcoming Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Inbound Enquiries Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-md border border-zinc-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-zinc-200/80 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Recent Customer Enquiries</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Latest customer submissions awaiting assessment or dispatch
              </p>
            </div>
            <Link
              href="/admin/enquiries"
              className="text-xs font-semibold text-[#49056B] hover:text-[#390044] inline-flex items-center gap-1"
            >
              <span>View All ({stats ? stats.totalEnquiries : 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentEnquiries.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Services</th>
                    <th className="py-2.5 px-4 hidden sm:table-cell">Received</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentEnquiries.map((enq) => (
                    <tr
                      key={enq.id}
                      className="hover:bg-zinc-50/70 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900">{enq.customer.name}</div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[180px]">
                          {enq.customer.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-zinc-500 hidden sm:table-cell">
                        {formatCanadianDate(enq.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        {renderStatusBadge(enq.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/enquiries?id=${enq.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#49056B] hover:text-[#390044] px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-zinc-400">
                {loading ? 'Loading customer enquiries...' : 'No enquiries found.'}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Consultations & Attention (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Consultations Box */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
              <h2 className="text-sm font-bold text-zinc-900">Upcoming Consultations</h2>
              <Link
                href="/admin/appointments"
                className="text-xs font-semibold text-[#49056B] hover:underline"
              >
                Schedule
              </Link>
            </div>

            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-md bg-zinc-50/70 border border-zinc-200/60 text-xs space-y-1 hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900 truncate pr-2">
                        {apt.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-zinc-200 text-zinc-700 capitalize shrink-0">
                        {apt.status}
                      </span>
                    </div>
                    <div className="text-zinc-600 text-[11px]">
                      Customer: {apt.customerName}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-0.5">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{formatOttawaDate(apt.scheduledStart)} at {formatOttawaTime(apt.scheduledStart)}</span>
                    </div>
                    {apt.assignedStaffName && (
                      <div className="text-[10px] text-zinc-400">
                        Staff: {apt.assignedStaffName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-zinc-400">
                No consultations currently scheduled.
              </div>
            )}
          </div>

          {/* Restrained Needs Attention Section */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
              <h2 className="text-sm font-bold text-zinc-900">Needs Attention</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Staff Tasks
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-md bg-zinc-50 border border-zinc-200/60">
                <Clock className="w-4 h-4 text-[#FE6000] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900">
                    {stats?.newEnquiries || 0} enquiries awaiting review
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Assess service requirements and confirm estimates with customers.
                  </p>
                </div>
              </div>

              {stats?.pendingHandoffs && stats.pendingHandoffs > 0 ? (
                <div className="flex items-start gap-2.5 p-2.5 rounded-md bg-zinc-50 border border-zinc-200/60">
                  <PhoneCall className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900">
                      {stats.pendingHandoffs} customer callbacks requested
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Respond to customer telephone callback inquiries.
                    </p>
                  </div>
                </div>
              ) : null}

              {stats?.failedDeliveries && stats.failedDeliveries > 0 ? (
                <div className="flex items-start gap-2.5 p-2.5 rounded-md bg-amber-50/60 border border-amber-200/80">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-amber-900">
                      {stats.failedDeliveries} email notifications need verification
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Verify transactional email provider configuration.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
