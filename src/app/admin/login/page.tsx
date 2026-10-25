'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setIsLoading(false);
        if (res.status === 423) {
          setErrorMessage(
            data.error ||
              'Account is temporarily locked due to multiple failed login attempts. Please try again later or reset your password.'
          );
        } else if (res.status === 503) {
          setErrorMessage('Sign-in is temporarily unavailable. Please try again shortly.');
        } else {
          setErrorMessage('Unable to sign in. Please verify your email and password.');
        }
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setErrorMessage('Sign-in is temporarily unavailable. Please check server status.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white text-[#202024] font-sans antialiased selection:bg-[#49056B] selection:text-white">
      {/* ========================================================================= */}
      {/* LEFT: Stexo-Inspired Geometric Brand Panel (Desktop only)                */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 relative bg-[#390044] text-white p-12 xl:p-16 flex-col justify-between overflow-hidden">
        {/* Subtle geometric background shapes (Stexo reference) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Angular Polygon 1 */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#49056B]/40 rounded-full blur-3xl" />
          {/* Angular Polygon 2 */}
          <div className="absolute top-1/3 -right-20 w-80 h-80 bg-purple-900/40 rounded-3xl rotate-45 transform" />
          {/* Angular Polygon 3 */}
          <div className="absolute -bottom-20 left-10 w-96 h-96 bg-[#25002D] rounded-3xl -rotate-12 border border-purple-800/20" />
          {/* Subtle grid lines */}
          <svg
            className="absolute inset-0 w-full h-full opacity-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="stexo-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stexo-grid)" />
          </svg>
        </div>

        {/* Top Header on Left Panel */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/15">
              <ShieldCheck className="w-5 h-5 text-[#C8E80B]" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-purple-200">
                Staff Operations Portal
              </span>
              <p className="text-xs text-white/70">Ottawa & Eastern Ontario</p>
            </div>
          </div>
        </div>

        {/* Center Content on Left Panel */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/10 text-xs font-medium text-purple-200 mb-6 border border-white/15">
            Verified Admin Access
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Integrated Service Operations for Laurrel
          </h2>

          <p className="text-sm text-purple-200/80 mt-4 leading-relaxed max-w-md">
            Manage customer quotations, multi-service scheduling, verified calendar dispatch, and client communications in one centralized platform.
          </p>

          <div className="mt-8 space-y-3 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 text-xs text-purple-100">
              <CheckCircle2 className="w-4 h-4 text-purple-200 shrink-0" />
              <span>Real-time residential & commercial enquiry triage</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-purple-100">
              <CheckCircle2 className="w-4 h-4 text-purple-200 shrink-0" />
              <span>Direct Ottawa consultation booking & video conference sync</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-purple-100">
              <CheckCircle2 className="w-4 h-4 text-purple-200 shrink-0" />
              <span>Automated customer notices & inventory tracking</span>
            </div>
          </div>
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
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-[#49056B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Public Website</span>
          </Link>
          <span className="text-xs text-zinc-400 hidden sm:inline-block">Staff Sign In</span>
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-[420px] mx-auto py-8">
          {/* Logo & Welcome Header */}
          <div className="mb-8">
            <div className="mb-6">
              <Logo priority />
            </div>
            <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-zinc-900">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Sign in to Laurrel Services
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

          {/* Form */}
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-[13px] font-medium text-zinc-700"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <Link
                  href="/admin/forgot-password"
                  className="text-xs text-[#49056B] hover:text-[#390044] hover:underline font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-11 px-3.5 pr-11 bg-white border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 p-1 text-zinc-400 hover:text-zinc-700 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-400 py-4 border-t border-zinc-100">
          <p>© {new Date().getFullYear()} Laurrel Services. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
