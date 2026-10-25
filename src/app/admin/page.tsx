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
  ChevronRight,
  User,
  MapPin,
  CheckCircle2,
  TrendingUp,
  Activity,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-[#FE6000] border border-orange-200/80">
            Awaiting Review
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            Reviewed
          </span>
        );
      case 'quoted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-[#390044] border border-purple-200/80">
            Quoted
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            Scheduled
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-50 text-zinc-400 border border-zinc-200/60">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 capitalize">
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

  const total60DayVolume = (stats?.timeline || []).reduce((acc, t) => acc + t.count, 0) || (stats?.totalEnquiries ?? 0);
  const peakDayCount = stats?.timeline && stats.timeline.length > 0
    ? Math.max(...stats.timeline.map((t) => t.count))
    : 0;

  const serviceChartData = (stats?.servicesBreakdown || []).map((s) => ({
    name: s.service.charAt(0).toUpperCase() + s.service.slice(1),
    count: s.count,
  }));

  const SERVICE_COLORS: Record<string, string> = {
    Moving: '#390044',
    Cleaning: '#FE6000',
    Storage: '#0D9488',
    General: '#6B7280',
  };

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A0022] border border-purple-700/60 rounded-xl p-3 shadow-xl text-xs text-white">
          <p className="font-semibold text-purple-200/90">{label}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C8E80B]" />
            <span className="text-zinc-300">Enquiries:</span>
            <span className="font-extrabold text-[#C8E80B] text-sm">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header (Canadian Commercial Restraint) */}
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
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-zinc-200/80 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-2xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
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

      {/* ========================================================================= */}
      {/* 1. HERO SECTION — Asymmetric High-Impact Composition                      */}
      {/* Left: 2x2 Geex-Inspired Confident Color-Block Tiles                       */}
      {/* Right: Tall 60-Day Enquiry Activity Chart Panel (Dark Plum Surface)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: 2x2 Solid Color-Block KPI Grid (approx 55% width on desktop) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Total Enquiries — Rich Laurrel Purple (#390044) */}
          <div className="bg-[#390044] text-white p-5 lg:p-6 rounded-2xl shadow-sm border border-purple-900/30 flex flex-col justify-between group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200/90 leading-tight">
                  Total Inbound Enquiries
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <Inbox className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-none">
                  {stats ? stats.totalEnquiries : '—'}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-purple-200/80 truncate pr-2">
                All-time quote requests
              </span>
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-purple-100 shrink-0">
                Ottawa & Region
              </span>
            </div>
          </div>

          {/* Card 2: Awaiting Review — Warm Orange / Coral (#FE6000) */}
          <div className="bg-[#FE6000] text-white p-5 lg:p-6 rounded-2xl shadow-sm border border-orange-600/30 flex flex-col justify-between group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-100 leading-tight">
                  Awaiting Review
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-none">
                  {stats ? stats.newEnquiries : '—'}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="text-orange-100/90 truncate pr-2">
                Requires triage & quote
              </span>
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white shrink-0">
                Action Required
              </span>
            </div>
          </div>

          {/* Card 3: Upcoming Consultations — Sophisticated Teal (#0D9488) */}
          <div className="bg-[#0D9488] text-white p-5 lg:p-6 rounded-2xl shadow-sm border border-teal-700/30 flex flex-col justify-between group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-100 leading-tight">
                  Upcoming Consultations
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-none">
                  {stats ? stats.upcomingAppointments : '—'}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="text-teal-100/90 truncate pr-2">
                Scheduled meetings in Ottawa
              </span>
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white shrink-0">
                Confirmed
              </span>
            </div>
          </div>

          {/* Card 4: Callback Requests — Muted Gold / Warm Amber (#D97706) */}
          <div className="bg-[#D97706] text-white p-5 lg:p-6 rounded-2xl shadow-sm border border-amber-700/30 flex flex-col justify-between group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100 leading-tight">
                  Callback Requests
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <PhoneCall className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-none">
                  {stats ? stats.pendingHandoffs : '—'}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="text-amber-100/90 truncate pr-2">
                Direct customer callbacks
              </span>
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white shrink-0">
                Direct Line
              </span>
            </div>
          </div>
        </div>

        {/* Right: Tall 60-Day Enquiry Activity Chart Panel (approx 45% width on desktop) */}
        <div className="lg:col-span-5 bg-[#25002D] text-white rounded-2xl p-6 shadow-sm border border-purple-900/40 flex flex-col justify-between">
          <div>
            {/* Chart Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Enquiry Activity Over Time
                  </h2>
                </div>
                <p className="text-xs text-purple-200/70 mt-0.5">
                  Verified daily inbound volume across Ottawa
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-[#C8E80B] border border-[#C8E80B]/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8E80B] animate-pulse" />
                Last 60 Days
              </span>
            </div>

            {/* Micro Metrics Summary Bar */}
            <div className="flex items-center gap-4 sm:gap-6 mt-3 pt-3 border-t border-purple-800/40 text-xs">
              <div>
                <span className="text-purple-200/60 block text-[10px] uppercase font-bold tracking-wider">
                  60-Day Total
                </span>
                <span className="text-white font-extrabold text-base">
                  {total60DayVolume}
                </span>
              </div>
              <div>
                <span className="text-purple-200/60 block text-[10px] uppercase font-bold tracking-wider">
                  Peak Day
                </span>
                <span className="text-[#C8E80B] font-extrabold text-base">
                  {peakDayCount}
                </span>
              </div>
              <div>
                <span className="text-purple-200/60 block text-[10px] uppercase font-bold tracking-wider">
                  Region
                </span>
                <span className="text-white font-extrabold text-base">
                  Ottawa, ON
                </span>
              </div>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="h-48 sm:h-56 lg:h-52 w-full mt-3">
            {mounted && timelineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineChartData}
                  margin={{ top: 10, right: 10, left: -24, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="limeChartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C8E80B" stopOpacity={0.35} />
                      <stop offset="85%" stopColor="#C8E80B" stopOpacity={0.02} />
                      <stop offset="100%" stopColor="#C8E80B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255, 255, 255, 0.08)"
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#D4D4D8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.12)' }}
                    minTickGap={28}
                  />
                  <YAxis
                    stroke="#D4D4D8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#C8E80B"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#limeChartGradient)"
                    name="Enquiries"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-purple-200/50">
                {loading ? 'Loading enquiry activity...' : 'No historical enquiry activity recorded in this period.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LOWER OPERATIONAL SECTION — CRM Data Table & Service Demand Breakdown  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Inbound Enquiries Table (8 cols on desktop) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-200/80 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Recent Customer Enquiries</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Latest customer submissions awaiting assessment or dispatch
              </p>
            </div>
            <Link
              href="/admin/enquiries"
              className="text-xs font-semibold text-[#390044] hover:text-[#520062] inline-flex items-center gap-1.5 transition-colors"
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
                    <th className="py-3 px-5">Customer</th>
                    <th className="py-3 px-4">Services</th>
                    <th className="py-3 px-4 hidden md:table-cell">Received</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentEnquiries.map((enq) => (
                    <tr
                      key={enq.id}
                      className="hover:bg-zinc-50/70 transition-colors group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-zinc-900">{enq.customer.name}</div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[200px]">
                          {enq.customer.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {enq.services.map((svc) => (
                            <span
                              key={svc}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 text-zinc-700 capitalize"
                            >
                              {svc}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 hidden md:table-cell text-xs">
                        {formatCanadianDate(enq.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(enq.status)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/admin/enquiries?id=${enq.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#390044] hover:text-[#520062] px-2.5 py-1 rounded-lg hover:bg-purple-50 transition-colors"
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

        {/* Right Column: Service Demand, Upcoming Consultations & Attention (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Secondary Card: Service Demand Breakdown */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Service Demand</h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Distribution by service category</p>
                </div>
                <span className="text-[11px] font-semibold text-zinc-400">Ottawa Market</span>
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
                        <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-36 flex items-center justify-center text-xs text-zinc-400">
                  {loading ? 'Loading service breakdown...' : 'No service data available.'}
                </div>
              )}
            </div>

            <div className="pt-4 mt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Primary Focus: Ottawa & Region</span>
              <Link
                href="/admin/enquiries"
                className="text-[#390044] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>View Enquiries</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Upcoming Consultations Box */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-zinc-100">
              <h2 className="text-sm font-bold text-zinc-900">Upcoming Consultations</h2>
              <Link
                href="/admin/appointments"
                className="text-xs font-semibold text-[#390044] hover:underline"
              >
                Schedule
              </Link>
            </div>

            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/60 text-xs space-y-1.5 hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900 truncate pr-2">
                        {apt.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-zinc-200 text-zinc-700 capitalize shrink-0">
                        {apt.status}
                      </span>
                    </div>
                    <div className="text-zinc-600 text-[11px]">
                      Customer: {apt.customerName}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-0.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
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
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-zinc-100">
              <h2 className="text-sm font-bold text-zinc-900">Needs Attention</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Staff Tasks
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-50/50 border border-orange-200/60">
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
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/50 border border-amber-200/60">
                  <PhoneCall className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
