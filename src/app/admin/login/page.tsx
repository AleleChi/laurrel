'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Lock, Mail, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRecoveryInfo, setShowRecoveryInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your administrator email and password.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid administrator email or password.');
        setIsLoading(false);
        return;
      }

      // Successful login
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setErrorMessage('Unable to reach the authentication service. Please verify your connection.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F7F4] px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Top return link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#575757] hover:text-[#49056B] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Website</span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-9 border border-black/[0.08] shadow-xl shadow-black/[0.03]">
          {/* Logo & Portal Heading */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative h-11 w-44 mb-4 select-none">
              <Image
                src="/assets/brand/laurrel-logo-primary.png"
                alt="Laurrel Services"
                fill
                sizes="176px"
                className="object-contain"
                priority
              />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#49056B]/[0.08] border border-[#49056B]/15 text-[#49056B] text-[11px] font-bold uppercase tracking-wider mb-2">
              <Shield className="w-3 h-3 text-[#FE6000]" />
              <span>Administration Portal</span>
            </div>
            <p className="text-xs text-[#575757]">
              Secure sign-in for authorized Laurrel operations personnel.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-xs text-red-800 leading-relaxed flex items-start gap-2.5"
            >
              <span className="font-bold shrink-0 text-red-600">Notice:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-bold uppercase tracking-wider text-[#202024]/80 mb-1.5"
              >
                Administrator Email
              </label>
              <div className="relative">
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. owner@laurrelservices.ca"
                  required
                  autoFocus
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-[#F8F7F4] border border-black/15 rounded-xl text-sm text-[#202024] placeholder:text-[#888] focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:border-transparent transition-all"
                />
                <Mail className="w-4 h-4 text-[#888] absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-bold uppercase tracking-wider text-[#202024]/80"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowRecoveryInfo(!showRecoveryInfo)}
                  className="text-xs text-[#49056B] hover:text-[#FE6000] font-semibold transition-colors"
                >
                  Need help?
                </button>
              </div>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 bg-[#F8F7F4] border border-black/15 rounded-xl text-sm text-[#202024] placeholder:text-[#888] focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-3 p-1 text-[#888] hover:text-[#202024] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Assistance Box */}
            {showRecoveryInfo && (
              <div className="p-3 bg-[#F8F7F4] border border-black/10 rounded-xl text-xs text-[#575757] leading-relaxed">
                <p className="font-semibold text-[#202024] mb-1">Access Assistance</p>
                <p>
                  To reset credentials or provision a new team member account, contact the system owner or dispatch lead directly. Accounts are managed centrally with strict role-based access.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#49056B] text-white text-sm font-bold shadow-md shadow-[#49056B]/20 hover:bg-[#49056B]/90 focus:outline-none focus:ring-4 focus:ring-[#49056B]/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#FE6000]" />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-black/[0.06] text-center">
            <p className="text-[11px] text-[#888] tracking-wide">
              LAURREL SERVICES • OTTAWA OPERATIONS
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
