'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your administrator email address.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setIsLoading(false);
        if (res.status === 503 || data.code === 'EMAIL_SERVICE_UNCONFIGURED') {
          setErrorMessage(
            data.error ||
              'Password recovery service is not currently configured. Please contact dispatch leadership or the system owner directly.'
          );
        } else {
          setErrorMessage(
            data.error || 'Unable to process recovery request. Please try again shortly.'
          );
        }
        return;
      }

      setIsLoading(false);
      setIsSubmitted(true);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(
        'Password recovery is temporarily unavailable. Please verify your connection or try again shortly.'
      );
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white text-[#202024] font-sans antialiased selection:bg-[#49056B] selection:text-white">
      {/* ========================================================================= */}
      {/* LEFT: Stexo-Inspired Geometric Brand Panel (Desktop only)                */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 relative bg-[#390044] text-white p-12 xl:p-16 flex-col justify-between overflow-hidden">
        {/* Subtle geometric background shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#49056B]/40 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-20 w-80 h-80 bg-purple-900/40 rounded-3xl rotate-45 transform" />
          <div className="absolute -bottom-20 left-10 w-96 h-96 bg-[#25002D] rounded-3xl -rotate-12 border border-purple-800/20" />
          <svg
            className="absolute inset-0 w-full h-full opacity-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="stexo-grid-fp" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stexo-grid-fp)" />
          </svg>
        </div>

        {/* Top Header on Left Panel */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/15">
              <ShieldCheck className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-purple-200">
                Staff Operations Portal
              </span>
              <p className="text-xs text-white/70">Account Security & Recovery</p>
            </div>
          </div>
        </div>

        {/* Center Content on Left Panel */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/10 text-xs font-medium text-purple-200 mb-6 border border-white/15">
            Secure Verification
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Protected Staff Authentication
          </h2>

          <p className="text-sm text-purple-200/80 mt-4 leading-relaxed max-w-md">
            If you have forgotten your password or need to reset your staff credentials, submit your registered administrator address.
          </p>
        </div>

        {/* Bottom Left Panel Footer */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-purple-200/70">
          <span>LAURREL SERVICES • Operations</span>
          <span>Ottawa, ON</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT: Dribbble-Inspired Balanced Authentication Surface                 */}
      {/* ========================================================================= */}
      <div className="col-span-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16 min-h-screen">
        {/* Top return link */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-[#49056B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to sign in</span>
          </Link>
          <span className="text-xs text-zinc-400 hidden sm:inline-block">Password Recovery</span>
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-[420px] mx-auto py-8">
          {/* Logo & Welcome Header */}
          <div className="mb-8">
            <div className="mb-6">
              <Logo priority />
            </div>
            <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-zinc-900">
              Reset your password
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Enter your email address and we'll send you a reset link.
            </p>
          </div>

          {/* Accessible Error Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed flex items-start gap-2.5"
            >
              <span className="font-semibold shrink-0 text-red-700">Notice:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {isSubmitted ? (
            <div className="p-6 rounded-md bg-zinc-50 border border-zinc-200/80 text-center space-y-4">
              <div className="w-11 h-11 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Check your inbox</h2>
                <p className="text-sm text-zinc-600 mt-1.5 leading-relaxed">
                  If an account exists for <strong>{email}</strong>, a password reset link has been sent. Please check your spam folder if it doesn't arrive shortly.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center w-full h-11 px-4 rounded-md bg-[#49056B] hover:bg-[#390044] text-white text-sm font-semibold transition-colors"
                >
                  Return to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-[13px] font-medium text-zinc-700 mb-1.5"
                >
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@laurrelservices.ca"
                  required
                  autoFocus
                  autoComplete="email"
                  className="w-full h-11 px-3.5 bg-white border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-2 rounded-md bg-[#49056B] text-white text-sm font-semibold hover:bg-[#390044] focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:ring-offset-1 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  <span>Send reset link</span>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/admin/login"
                  className="text-xs font-semibold text-zinc-500 hover:text-[#49056B] transition-colors"
                >
                  Remember your password? Sign in
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-400 py-4 border-t border-zinc-100">
          <p>© {new Date().getFullYear()} Laurrel Services. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
