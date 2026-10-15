'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  LogOut,
  RefreshCw,
  Search,
  MessageSquare,
  UserCheck,
  KeyRound,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'dispatcher';
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

interface Stats {
  totalEnquiries: number;
  newEnquiries: number;
  reviewed: number;
  scheduled: number;
  failedDeliveries: number;
  pendingHandoffs: number;
}

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Login form state
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Recovery form state
  const [showRecovery, setShowRecovery] = useState<boolean>(false);
  const [recoveryEmail, setRecoveryEmail] = useState<string>('');
  const [recoveryMessage, setRecoveryMessage] = useState<string>('');
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  // Dashboard data state
  const [stats, setStats] = useState<Stats | null>(null);
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [handoffs, setHandoffs] = useState<AiHandoffItem[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'enquiries' | 'handoffs'>('enquiries');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');

  // Check existing session cookie on mount
  useEffect(() => {
    checkCurrentSession();
  }, []);

  const checkCurrentSession = async () => {
    setCheckingAuth(true);
    try {
      const res = await fetch('/api/admin/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          setIsAuthenticated(true);
        }
      }
    } catch (err) {
      console.warn('[Session check]: Not authenticated or server unavailable');
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, statusFilter, serviceFilter]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!emailInput.trim() || !passwordInput.trim()) {
      setLoginError('Please enter both your administrator email and password.');
      return;
    }

    try {
      setIsLoggingIn(true);
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          password: passwordInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Invalid administrator credentials.');
        setIsLoggingIn(false);
        return;
      }

      setCurrentUser(data.user);
      setIsAuthenticated(true);
      setIsLoggingIn(false);
    } catch (err) {
      setLoginError('Could not verify credentials with backend service.');
      setIsLoggingIn(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage('');

    if (!recoveryEmail.trim()) {
      setRecoveryMessage('Please provide your administrator email address.');
      return;
    }

    try {
      setIsRecovering(true);
      const res = await fetch('/api/admin/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail.trim() }),
      });

      const data = await res.json();
      setRecoveryMessage(
        data.message || 'Recovery instructions have been sent to authorized administrator records.'
      );
    } catch (err) {
      setRecoveryMessage('Could not submit recovery request. Please contact technical dispatch.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('[Logout]: Error clearing session:', err);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    setEnquiries([]);
    setSelectedEnquiry(null);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      let url = '/api/admin/enquiries?limit=100';
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (serviceFilter !== 'all') url += `&service=${serviceFilter}`;

      const enqRes = await fetch(url);
      if (enqRes.ok) {
        const enqData = await enqRes.json();
        setEnquiries(enqData.enquiries || []);
        if (selectedEnquiry) {
          const refreshed = (enqData.enquiries || []).find((e: EnquiryItem) => e.id === selectedEnquiry.id);
          if (refreshed) setSelectedEnquiry(refreshed);
        }
      }

      // Fetch AI Handoffs
      const handoffsRes = await fetch('/api/admin/handoffs');
      if (handoffsRes.ok) {
        const handoffsData = await handoffsRes.json();
        setHandoffs(handoffsData.handoffs || []);
      }
    } catch (e) {
      console.error('[Dashboard fetch error]:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          note: newNote.trim() || undefined,
          author: currentUser?.name || 'Administrator',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.enquiry) {
          setSelectedEnquiry(data.enquiry);
          setEnquiries((prev) => prev.map((e) => (e.id === id ? data.enquiry : e)));
        }
        setNewNote('');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('[Status update failed]:', err);
    }
  };

  // Filtered list
  const filteredEnquiries = enquiries.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.id.toLowerCase().includes(q) ||
      e.customer.name.toLowerCase().includes(q) ||
      e.customer.email.toLowerCase().includes(q) ||
      (e.serviceLocation && e.serviceLocation.toLowerCase().includes(q))
    );
  });

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-[#390044] animate-spin" />
          <p className="text-xs font-bold text-[#390044] tracking-wider uppercase">
            Verifying Administrator Session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4] px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-black/[0.08] shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#390044] text-[#C8E80B] flex items-center justify-center font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#390044] tracking-tight">LAURREL OPERATIONS</h1>
              <p className="text-xs text-[#575757]">Business Administration Portal</p>
            </div>
          </div>

          {!showRecovery ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#202024]/80 mb-1.5">
                  Administrator Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. owner@laurrelservices.ca"
                    className="w-full px-4 py-3 bg-[#F8F7F4] border border-black/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#390044]"
                    autoFocus
                    required
                  />
                  <Mail className="w-4 h-4 text-[#888] absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#202024]/80 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full px-4 py-3 bg-[#F8F7F4] border border-black/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#390044]"
                    required
                  />
                  <Lock className="w-4 h-4 text-[#888] absolute right-3.5 top-3.5" />
                </div>
              </div>

              {loginError && (
                <div className="text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 bg-[#390044] hover:bg-[#4a0058] text-[#C8E80B] font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {isLoggingIn ? 'Verifying Session...' : 'Sign In to Operations Portal'}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="text-xs font-semibold text-[#575757] hover:text-[#390044]"
                >
                  Forgot password?
                </button>
                <span className="text-[11px] text-[#888]">HttpOnly Cookie Session</span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div className="mb-2">
                <h2 className="text-sm font-bold text-[#390044]">Account Recovery</h2>
                <p className="text-xs text-[#575757] mt-0.5">
                  Enter your registered administrator email to receive secure recovery steps.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#202024]/80 mb-1.5">
                  Registered Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="owner@laurrelservices.ca"
                    className="w-full px-4 py-3 bg-[#F8F7F4] border border-black/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#390044]"
                    autoFocus
                    required
                  />
                  <KeyRound className="w-4 h-4 text-[#888] absolute right-3.5 top-3.5" />
                </div>
              </div>

              {recoveryMessage && (
                <div className="text-xs text-neutral-800 bg-neutral-100 p-3 rounded-xl border border-neutral-300">
                  {recoveryMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isRecovering}
                className="w-full py-3.5 bg-[#390044] hover:bg-[#4a0058] text-[#C8E80B] font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {isRecovering ? 'Submitting Request...' : 'Send Recovery Instructions'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecovery(false);
                    setRecoveryMessage('');
                  }}
                  className="text-xs font-semibold text-[#575757] hover:text-[#390044]"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-black/[0.06] text-center">
            <Link href="/" className="text-xs text-[#575757] hover:text-[#390044]">
              ← Return to Laurrel Services website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col">
      {/* Top Navbar */}
      <header className="bg-[#390044] text-white px-6 py-4 flex items-center justify-between border-b border-black/10">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#C8E80B] text-[#390044] flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">LAURREL OPERATIONS ADMIN</h1>
            <p className="text-[11px] text-[#C8E80B]/80">Ottawa Dispatch & Customer Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-xs text-white">
              <UserCheck className="w-3.5 h-3.5 text-[#C8E80B]" />
              <span>{currentUser.name}</span>
              <span className="uppercase text-[10px] font-bold bg-[#C8E80B] text-[#390044] px-1.5 py-0.5 rounded">
                {currentUser.role}
              </span>
            </div>
          )}

          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs text-red-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#777]">Total Leads</p>
            <p className="text-2xl font-extrabold text-[#390044] mt-1">{stats?.totalEnquiries ?? '-'}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#777]">New Submissions</p>
            <p className="text-2xl font-extrabold text-[#5B8200] mt-1">{stats?.newEnquiries ?? '-'}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#777]">Under Review</p>
            <p className="text-2xl font-extrabold text-[#202024] mt-1">{stats?.reviewed ?? '-'}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#777]">Scheduled</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1">{stats?.scheduled ?? '-'}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#777]">Email Dispatches</p>
            <p className="text-2xl font-extrabold text-[#390044] mt-1">
              {stats ? stats.totalEnquiries - stats.failedDeliveries : '-'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#777]">AI Handoffs</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{stats?.pendingHandoffs ?? '-'}</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-black/[0.08] gap-4">
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'enquiries'
                ? 'border-[#390044] text-[#390044]'
                : 'border-transparent text-[#777] hover:text-[#202024]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Customer Enquiries</span>
            <span className="text-xs bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded-full font-mono">
              {enquiries.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('handoffs')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'handoffs'
                ? 'border-[#390044] text-[#390044]'
                : 'border-transparent text-[#777] hover:text-[#202024]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>AI Assistant Handoffs</span>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono">
              {handoffs.length}
            </span>
          </button>
        </div>

        {activeTab === 'enquiries' ? (
          /* Dashboard 2-Column Split for Enquiries */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Enquiries List */}
            <div className="lg:col-span-5 xl:col-span-5 bg-white rounded-3xl border border-black/[0.08] shadow-sm p-4 sm:p-5 flex flex-col h-[750px]">
              {/* Search & Filter Bar */}
              <div className="space-y-3 pb-4 border-b border-black/[0.08]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, ref, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#F8F7F4] border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#390044]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#888] absolute left-3 top-2.5" />
                </div>

                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-[#F8F7F4] border border-black/10 rounded-lg text-xs"
                  >
                    <option value="all">All Statuses</option>
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="quoted">Quoted</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="closed">Closed</option>
                  </select>

                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-[#F8F7F4] border border-black/10 rounded-lg text-xs"
                  >
                    <option value="all">All Services</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="moving">Moving</option>
                    <option value="storage">Storage</option>
                  </select>
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto divide-y divide-black/[0.06] mt-2">
                {filteredEnquiries.length === 0 ? (
                  <div className="text-center py-12 text-[#888] text-xs">
                    No enquiries matching current filters.
                  </div>
                ) : (
                  filteredEnquiries.map((enq) => {
                    const isSelected = selectedEnquiry?.id === enq.id;
                    return (
                      <button
                        key={enq.id}
                        onClick={() => {
                          setSelectedEnquiry(enq);
                          setUpdatingStatus(enq.status);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl transition-all my-1 ${
                          isSelected ? 'bg-[#390044] text-white' : 'hover:bg-[#F8F7F4] text-[#202024]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[11px] font-mono font-bold ${
                              isSelected ? 'text-[#C8E80B]' : 'text-[#555]'
                            }`}
                          >
                            {enq.id}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              enq.status === 'new'
                                ? 'bg-[#C8E80B] text-[#202024]'
                                : enq.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {enq.status}
                          </span>
                        </div>
                        <p className="text-sm font-bold mt-1 truncate">{enq.customer.name}</p>
                        <p className={`text-xs truncate ${isSelected ? 'text-white/80' : 'text-[#666]'}`}>
                          {enq.services.join(' · ').toUpperCase()}
                        </p>
                        <p className={`text-[11px] mt-1 truncate ${isSelected ? 'text-white/60' : 'text-[#888]'}`}>
                          {new Date(enq.createdAt).toLocaleDateString()} · {enq.serviceLocation || 'Ottawa'}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Enquiry Detail & Action Panel */}
            <div className="lg:col-span-7 xl:col-span-7 bg-white rounded-3xl border border-black/[0.08] shadow-sm p-6 sm:p-8 flex flex-col h-[750px] overflow-y-auto">
              {selectedEnquiry ? (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/[0.08] gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-[#5B8200]">{selectedEnquiry.id}</span>
                      <h2 className="text-xl font-extrabold text-[#390044]">{selectedEnquiry.customer.name}</h2>
                      <p className="text-xs text-[#777]">Received: {new Date(selectedEnquiry.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#575757]">Status:</span>
                      <select
                        value={updatingStatus || selectedEnquiry.status}
                        onChange={(e) => {
                          setUpdatingStatus(e.target.value);
                          handleUpdateStatus(selectedEnquiry.id, e.target.value);
                        }}
                        className="px-3 py-1.5 bg-[#F8F7F4] border border-black/15 rounded-lg text-xs font-bold text-[#390044]"
                      >
                        <option value="new">New</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="quoted">Quoted</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact & Service Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F8F7F4] p-4 rounded-2xl border border-black/[0.06]">
                    <div className="space-y-2 text-xs">
                      <p className="flex items-center gap-2 text-[#202024]">
                        <Mail className="w-3.5 h-3.5 text-[#555]" />
                        <a href={`mailto:${selectedEnquiry.customer.email}`} className="hover:underline font-medium">
                          {selectedEnquiry.customer.email}
                        </a>
                      </p>
                      <p className="flex items-center gap-2 text-[#202024]">
                        <Phone className="w-3.5 h-3.5 text-[#555]" />
                        <span>{selectedEnquiry.customer.phone || 'Phone not provided'}</span>
                      </p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <p className="flex items-center gap-2 text-[#202024]">
                        <MapPin className="w-3.5 h-3.5 text-[#555]" />
                        <span>{selectedEnquiry.serviceLocation || 'Ottawa Region'}</span>
                      </p>
                      <p className="flex items-center gap-2 text-[#202024]">
                        <Calendar className="w-3.5 h-3.5 text-[#555]" />
                        <span>{selectedEnquiry.preferredTiming || 'Timing flexible / not set'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Services Requested */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#777] mb-2">Requested Services</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEnquiry.services.map((svc) => (
                        <span
                          key={svc}
                          className="px-3 py-1 bg-[#390044] text-[#C8E80B] rounded-full text-xs font-bold uppercase"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Message / Details */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#777] mb-2">Job Description</h3>
                    <div className="p-4 bg-[#FAFAFA] rounded-2xl border border-black/[0.06] text-sm text-[#202024] whitespace-pre-wrap leading-relaxed">
                      {selectedEnquiry.details}
                    </div>
                  </div>

                  {/* Internal Notes History */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#777] mb-2">Internal Follow-Up Notes</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                      {(selectedEnquiry.internalNotes || []).map((note) => (
                        <div key={note.id} className="p-3 bg-[#F8F7F4] rounded-xl text-xs border border-black/[0.04]">
                          <p className="text-[#202024] font-normal">{note.note}</p>
                          <p className="text-[10px] text-[#888] mt-1">
                            {note.author} · {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Add Note Form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add an internal follow-up note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="flex-1 px-3.5 py-2 bg-[#F8F7F4] border border-black/15 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#390044]"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedEnquiry.id, selectedEnquiry.status)}
                        disabled={!newNote.trim()}
                        className="px-4 py-2 bg-[#390044] text-[#C8E80B] rounded-xl text-xs font-bold disabled:opacity-40"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-[#888]">
                  <FileText className="w-12 h-12 stroke-[1.5] text-neutral-300 mb-3" />
                  <p className="text-sm font-bold text-[#555]">Select an enquiry from the list</p>
                  <p className="text-xs text-[#888] mt-1">View complete customer details, requirements, and update status.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* AI Assistant Handoffs Tab */
          <div className="bg-white rounded-3xl border border-black/[0.08] shadow-sm p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#390044]">AI Assistant Escalations & Human Handoffs</h2>
              <p className="text-xs text-[#575757] mt-1">
                Conversations where visitors requested human coordinator follow-up through the website assistant.
              </p>
            </div>

            {handoffs.length === 0 ? (
              <div className="text-center py-16 text-[#888]">
                <Sparkles className="w-12 h-12 stroke-[1.5] text-amber-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-[#555]">No pending AI handoffs.</p>
                <p className="text-xs text-[#888] mt-1">When assistant sessions require coordinator contact, they will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-black/[0.08] text-[#777] uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 font-bold">Customer</th>
                      <th className="py-3 px-4 font-bold">Contact</th>
                      <th className="py-3 px-4 font-bold">Location</th>
                      <th className="py-3 px-4 font-bold">Reason for Handoff</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {handoffs.map((h) => (
                      <tr key={h.id} className="hover:bg-[#F8F7F4]/80">
                        <td className="py-3.5 px-4 font-bold text-[#202024]">{h.customerName || 'Website Visitor'}</td>
                        <td className="py-3.5 px-4 text-[#555]">
                          <div>{h.customerEmail}</div>
                          {h.customerPhone && <div className="text-[11px] text-[#888]">{h.customerPhone}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-[#555]">{h.serviceLocation || 'Ottawa'}</td>
                        <td className="py-3.5 px-4 max-w-xs text-[#333] leading-relaxed">{h.reason}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              h.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {h.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#888] whitespace-nowrap">
                          {new Date(h.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
