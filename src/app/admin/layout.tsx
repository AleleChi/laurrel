'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  FileEdit,
  Image as ImageIcon,
  CalendarDays,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Clock,
  Shield,
  User,
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'content_editor' | 'operations_staff' | 'viewer';
}

// Route-specific breadcrumbs with proper hierarchy
function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [
    { label: 'Administration', href: '/admin' },
  ];

  if (pathname === '/admin') {
    crumbs.push({ label: 'Overview' });
  } else if (pathname === '/admin/enquiries') {
    crumbs.push({ label: 'Customer Enquiries' });
  } else if (pathname.startsWith('/admin/appointments')) {
    crumbs.push({ label: 'Appointments & Consultations' });
  } else if (pathname === '/admin/media') {
    crumbs.push({ label: 'Media Library' });
  } else if (pathname.startsWith('/admin/website')) {
    crumbs.push({ label: 'Website Content', href: '/admin/website' });
    if (pathname === '/admin/website/home') {
      crumbs.push({ label: 'Homepage' });
    } else if (pathname === '/admin/website/about') {
      crumbs.push({ label: 'About Us' });
    } else if (pathname === '/admin/website/services') {
      crumbs.push({ label: 'Services' });
    } else if (pathname === '/admin/website/contact') {
      crumbs.push({ label: 'Contact' });
    } else {
      const pageId = pathname.replace('/admin/website/', '').split('/')[0];
      if (pageId && pageId !== 'website') {
        const titleCase = pageId.charAt(0).toUpperCase() + pageId.slice(1);
        crumbs.push({ label: titleCase });
      }
    }
  }

  return crumbs;
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [ottawaTime, setOttawaTime] = useState<string>('');

  const isAuthPage =
    pathname === '/admin/login' ||
    pathname === '/admin/forgot-password' ||
    pathname === '/admin/reset-password';

  // Live Ottawa Time Display for Dispatchers
  useEffect(() => {
    const updateTime = () => {
      try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Toronto',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZoneName: 'short',
        });
        setOttawaTime(formatter.format(new Date()));
      } catch (e) {
        setOttawaTime('');
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAuthPage) {
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
        router.push('/admin/login');
      } catch (err) {
        router.push('/admin/login');
      }
    };

    verifySession();
  }, [pathname, isAuthPage, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('[Logout Error]:', err);
    }
    setCurrentUser(null);
    router.push('/admin/login');
  };

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="min-h-screen flex items-center justify-center bg-[#F8F7F4]"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-9 w-40 motion-safe:animate-pulse">
            <Image
              src="/assets/brand/laurrel-logo-primary.png"
              alt="Laurrel Services"
              fill
              sizes="160px"
              className="object-contain"
              priority
            />
          </div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">
            Loading Operations Portal...
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      label: 'Overview',
      href: '/admin',
      icon: LayoutDashboard,
      active: pathname === '/admin',
    },
    {
      label: 'Customer Enquiries',
      href: '/admin/enquiries',
      icon: Inbox,
      active: pathname === '/admin/enquiries',
    },
    {
      label: 'Appointments',
      href: '/admin/appointments',
      icon: CalendarDays,
      active: pathname.startsWith('/admin/appointments'),
    },
    {
      label: 'Website Content',
      href: '/admin/website',
      icon: FileEdit,
      active: pathname.startsWith('/admin/website'),
    },
    {
      label: 'Media Library',
      href: '/admin/media',
      icon: ImageIcon,
      active: pathname.startsWith('/admin/media'),
    },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'LS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex text-[#202024] font-sans antialiased selection:bg-[#49056B]/15">
      {/* Desktop Sidebar (WowDash / Geex Inspired Architecture) */}
      <aside
        className={`hidden lg:flex lg:flex-col bg-white border-r border-zinc-200/80 shrink-0 sticky top-0 h-screen z-30 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-zinc-200/80 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <Link href="/" target="_blank" className="relative h-8 w-36 select-none block">
              <Image
                src="/assets/brand/laurrel-logo-primary.png"
                alt="Laurrel Services"
                fill
                sizes="144px"
                className="object-contain object-left"
                priority
              />
            </Link>
          ) : (
            <div className="w-10 h-10 rounded-md bg-[#49056B] flex items-center justify-center text-white font-bold text-sm tracking-wider">
              L
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <div>
            {!sidebarCollapsed && (
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Core Operations
              </div>
            )}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      sidebarCollapsed ? 'justify-center px-0' : ''
                    } ${
                      item.active
                        ? 'bg-[#49056B]/[0.08] text-[#49056B] font-semibold'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
                    }`}
                  >
                    <Icon
                      strokeWidth={1.8}
                      className={`w-4.5 h-4.5 shrink-0 ${
                        item.active ? 'text-[#49056B]' : 'text-zinc-400'
                      }`}
                    />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Account & Profile Footer */}
        <div className="p-3.5 border-t border-zinc-200/80 bg-zinc-50/50">
          {!sidebarCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-md bg-white border border-zinc-200/80 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-md bg-[#49056B]/10 text-[#49056B] font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(currentUser?.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 truncate">
                      {currentUser?.name || 'Administrator'}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium truncate">
                      {currentUser?.role || 'Staff'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between px-1 text-[11px] text-zinc-500">
                <span className="font-medium text-zinc-400">Ottawa, ON</span>
                <Link
                  href="/"
                  target="_blank"
                  className="hover:text-[#49056B] inline-flex items-center gap-1 font-medium transition-colors"
                >
                  <span>View Website</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                title={`${currentUser?.name} (${currentUser?.role})`}
                className="w-8 h-8 rounded-md bg-[#49056B]/10 text-[#49056B] font-bold text-xs flex items-center justify-center cursor-default"
              >
                {getInitials(currentUser?.name)}
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                aria-label="Sign Out"
                className="p-2 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col border-r border-zinc-200 shadow-xl z-10">
            <div className="h-16 px-5 border-b border-zinc-200/80 flex items-center justify-between">
              <div className="relative h-7 w-32 select-none">
                <Image
                  src="/assets/brand/laurrel-logo-primary.png"
                  alt="Laurrel Services"
                  fill
                  sizes="128px"
                  className="object-contain object-left"
                />
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        item.active
                          ? 'bg-[#49056B]/[0.08] text-[#49056B] font-semibold'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
                      }`}
                    >
                      <Icon strokeWidth={1.8} className="w-4.5 h-4.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-zinc-200/80 bg-zinc-50/50">
              <div className="flex items-center justify-between p-2.5 rounded-md bg-white border border-zinc-200/80 mb-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-md bg-[#49056B]/10 text-[#49056B] font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(currentUser?.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 truncate">{currentUser?.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium truncate">
                      {currentUser?.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/"
                  target="_blank"
                  className="text-xs text-zinc-600 hover:text-[#49056B] inline-flex items-center gap-1.5 font-medium transition-colors"
                >
                  <span>View Public Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar (Inspired by WowDash / Geex) */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-zinc-200/80 px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Hierarchy */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500">
              {getBreadcrumbs(pathname).map((crumb, idx, arr) => {
                const isLast = idx === arr.length - 1;
                return (
                  <React.Fragment key={crumb.label}>
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />}
                    {crumb.href && !isLast ? (
                      <Link href={crumb.href} className="hover:text-zinc-900 font-medium transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={isLast ? 'text-zinc-900 font-semibold' : 'font-medium'}>
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          {/* Contextual Actions & Operational Indicators */}
          <div className="flex items-center gap-3 sm:gap-4">
            {ottawaTime && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-50 border border-zinc-200/70 text-xs font-medium text-zinc-600">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{ottawaTime}</span>
              </div>
            )}

            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-[#49056B] bg-white hover:bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-md transition-colors shadow-2xs"
            >
              <span>View Website</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </Link>

            <div className="h-4 w-px bg-zinc-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#49056B]/10 text-[#49056B] font-bold text-xs flex items-center justify-center">
                {getInitials(currentUser?.name)}
              </div>
              <span className="text-xs font-semibold text-zinc-800 hidden sm:inline-block max-w-[120px] truncate">
                {currentUser?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
