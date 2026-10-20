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
  ExternalLink,
  ChevronRight,
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
      label: 'Business Overview',
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
  ];

  const plannedModules = [
    { label: 'Website Content', icon: FileEdit },
    { label: 'Quotes & Billing', icon: Receipt },
    { label: 'Staff & Dispatch', icon: Users },
    { label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex text-[#202024] font-sans antialiased">
      {/* Desktop Sidebar (256px) - Calm, clean, structured */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-black/[0.06] shrink-0 sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-black/[0.06] flex flex-col gap-1.5">
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
          <p className="text-[11px] font-medium tracking-wider uppercase text-zinc-400">
            Operations Portal
          </p>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Operations
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[10px] text-xs font-medium transition-all ${
                      item.active
                        ? 'bg-[#49056B]/[0.08] text-[#49056B] font-semibold'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.03]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        item.active ? 'text-[#49056B]' : 'text-zinc-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Roadmap
            </div>
            <div className="space-y-1">
              {plannedModules.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.label}
                    className="flex items-center gap-3 px-3 py-2 rounded-[10px] text-xs text-zinc-400 select-none cursor-default"
                  >
                    <Icon className="w-4 h-4 text-zinc-300" />
                    <span>{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-black/[0.06] bg-zinc-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-black/[0.06] mb-2.5">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-zinc-900 truncate">{currentUser?.name}</p>
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                <span className="capitalize">{currentUser?.role}</span> • {currentUser?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>System Online</span>
            </span>
            <Link
              href="/"
              target="_blank"
              className="hover:text-zinc-800 inline-flex items-center gap-1 transition-colors"
            >
              <span>Live Site</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col border-r border-black/[0.08] shadow-xl z-10">
            <div className="p-5 border-b border-black/[0.06] flex items-center justify-between">
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
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-black/5"
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
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-xs font-medium transition-all ${
                        item.active
                          ? 'bg-[#49056B]/[0.08] text-[#49056B] font-semibold'
                          : 'text-zinc-600 hover:bg-black/[0.03]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-2 border-t border-black/[0.06]">
                <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Roadmap
                </div>
                {plannedModules.map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center gap-3 px-3 py-2 text-xs text-zinc-400"
                  >
                    <span>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-black/[0.06]">
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 mb-2">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-semibold text-zinc-900 truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                    <span className="capitalize">{currentUser?.role}</span>
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"
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
        {/* Top Header Bar - Quiet, editorial, non-distracting */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-black/[0.06] px-5 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-500 hover:bg-black/5"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <span>Laurrel Operations</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
              <span className="text-zinc-900 font-semibold">
                {pathname === '/admin' ? 'Overview' : pathname === '/admin/enquiries' ? 'Enquiries & Dispatch' : 'Portal'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Database Connected</span>
            </div>
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#49056B] font-medium transition-colors"
            >
              <span>View Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
