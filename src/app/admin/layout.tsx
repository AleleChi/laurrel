'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  FileEdit,
  Receipt,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ExternalLink,
  Database,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'content_editor' | 'operations_staff' | 'viewer';
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // If on login page, render child component directly without admin shell
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const verifySession = async () => {
      try {
        const res = await fetch('/api/admin/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            setLoading(false);
            return;
          }
        }
        // Not authenticated
        router.push('/admin/login');
      } catch (err) {
        router.push('/admin/login');
      }
    };

    verifySession();
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('[Logout Error]:', err);
    }
    setCurrentUser(null);
    router.push('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#49056B] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#49056B] tracking-wider uppercase">
            Loading Administration Shell...
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      label: 'Business Overview',
      href: '/admin',
      icon: LayoutDashboard,
      active: pathname === '/admin',
      available: true,
    },
    {
      label: 'Customer Enquiries',
      href: '/admin/enquiries',
      icon: Inbox,
      active: pathname === '/admin/enquiries',
      available: true,
    },
  ];

  const plannedModules = [
    { label: 'Website Content', badge: 'Module 02', icon: FileEdit },
    { label: 'Quotes & Billing', badge: 'Module 03', icon: Receipt },
    { label: 'Staff & Dispatch', badge: 'Module 04', icon: Users },
    { label: 'System Settings', badge: 'Module 05', icon: Settings },
  ];

  const roleBadgeColor = {
    owner: 'bg-purple-100 text-[#49056B] border-[#49056B]/20',
    admin: 'bg-orange-50 text-[#FE6000] border-[#FE6000]/30',
    content_editor: 'bg-blue-50 text-blue-700 border-blue-200',
    operations_staff: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    viewer: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  }[currentUser?.role || 'viewer'];

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex text-[#202024]">
      {/* Desktop Sidebar (250px) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-black/[0.08] shrink-0 sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-black/[0.06] flex flex-col gap-2">
          <div className="relative h-9 w-36 select-none">
            <Image
              src="/assets/brand/laurrel-logo-primary.png"
              alt="Laurrel Services"
              fill
              sizes="144px"
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#49056B] tracking-wider uppercase">
            <Shield className="w-3.5 h-3.5 text-[#FE6000]" />
            <span>Administration</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-[#888]">
              Operational Core
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      item.active
                        ? 'bg-[#49056B] text-white shadow-sm'
                        : 'text-[#575757] hover:bg-[#F8F7F4] hover:text-[#202024]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-white' : 'text-[#888]'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-[#888] flex items-center justify-between">
              <span>Platform Modules</span>
              <span className="text-[9px] font-normal lowercase tracking-normal text-[#aaa]">roadmap</span>
            </div>
            <div className="space-y-1">
              {plannedModules.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.label}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#999] bg-transparent opacity-75 select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 text-[#bbb]" />
                      <span>{m.label}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/[0.04] text-[#888] font-mono">
                      {m.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-black/[0.06] bg-[#F8F7F4]/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-black/[0.06] mb-2">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-[#202024] truncate">{currentUser?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider border ${roleBadgeColor}`}
                >
                  {currentUser?.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2 rounded-lg text-[#888] hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between px-2 text-[11px] text-[#888]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Neon Connected</span>
            </span>
            <Link
              href="/"
              target="_blank"
              className="hover:text-[#49056B] inline-flex items-center gap-1"
            >
              <span>Site</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col border-r border-black/10 shadow-2xl z-10">
            <div className="p-4 border-b border-black/[0.06] flex items-center justify-between">
              <div className="relative h-8 w-32 select-none">
                <Image
                  src="/assets/brand/laurrel-logo-primary.png"
                  alt="Laurrel Services"
                  fill
                  sizes="128px"
                  className="object-contain"
                />
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-[#888] hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        item.active
                          ? 'bg-[#49056B] text-white'
                          : 'text-[#575757] hover:bg-[#F8F7F4]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-2 border-t border-black/[0.06]">
                <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-[#888]">
                  Roadmap Modules
                </div>
                {plannedModules.map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center justify-between px-3 py-2 text-xs text-[#999]"
                  >
                    <span>{m.label}</span>
                    <span className="text-[10px] text-[#bbb] font-mono">{m.badge}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-black/[0.06]">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8F7F4] mb-2">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-[#202024] truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-[#888] truncate">{currentUser?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-black/[0.08] px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#575757] hover:bg-black/5"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#575757]">
              <span>Laurrel Administration</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#bbb]" />
              <span className="text-[#202024] font-bold">
                {pathname === '/admin' ? 'Overview' : pathname === '/admin/enquiries' ? 'Enquiries' : 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Neon PostgreSQL Active</span>
            </div>
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#575757] hover:text-[#49056B] font-semibold transition-colors"
            >
              <span>View Live Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
