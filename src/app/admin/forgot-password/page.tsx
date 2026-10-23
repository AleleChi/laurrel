'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';

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
    <main className="min-h-screen flex items-center justify-center bg-[#F8F7F4] px-4 py-12 font-sans antialiased text-[#202024]">
      <div className="w-full max-w-[400px]">
        {/* Return to login link */}
        <div className="mb-4">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-[#49056B] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-md p-6 sm:p-8 border border-zinc-200/80 shadow-2xs">
          {/* Logo & Heading */}
          <div className="flex flex-col items-center text-center mb-6">
            <Link href="/" className="relative h-8 w-36 mb-3 select-none block">
              <Image
                src="/assets/brand/laurrel-logo-primary.png"
                alt="Laurrel Services"
                fill
                sizes="144px"
                className="object-contain"
                priority
              />
            </Link>
            <h1 className="text-base font-bold tracking-tight text-zinc-900">
              Password Recovery
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Enter your administrator email to receive reset instructions
            </p>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed flex items-start gap-2"
            >
              <span className="font-semibold shrink-0 text-red-700">Notice:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {isSubmitted ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-zinc-900">Recovery Instructions Dispatched</h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                If an active administrator account exists for <strong>{email}</strong>, a secure password reset link has been dispatched to that inbox.
              </p>
              <div className="pt-3">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center w-full py-2 px-4 rounded-md bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 transition-colors"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="recovery-email"
                  className="block text-xs font-semibold text-zinc-700 mb-1"
                >
                  Administrator Email
                </label>
                <div className="relative">
                  <input
                    id="recovery-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. staff@laurrelservices.ca"
                    required
                    autoFocus
                    autoComplete="email"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:bg-white transition-all"
                  />
                  <Mail className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-md bg-[#49056B] text-white text-xs font-semibold hover:bg-[#390044] focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-zinc-100 text-center">
            <p className="text-[10px] text-zinc-400 tracking-wider uppercase font-semibold">
              Laurrel Services • Ottawa Operations
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
