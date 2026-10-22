'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token.trim()) {
      setErrorMessage('Missing password reset token. Please request a new reset link.');
      return;
    }

    if (newPassword.length < 10) {
      setErrorMessage('Password must be at least 10 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your entries.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setIsLoading(false);
        setErrorMessage(
          data.error ||
            'Password reset failed. The link may have expired or was already used. Please request a new reset link.'
        );
        return;
      }

      setIsLoading(false);
      setIsSuccess(true);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Unable to connect to the authentication service. Please try again shortly.');
    }
  };

  if (!token.trim()) {
    return (
      <div className="text-center py-2 space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Missing Reset Token</h2>
          <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
            The password reset link appears incomplete or malformed. Please use the link provided in your email or request a new one.
          </p>
        </div>
        <Link
          href="/admin/forgot-password"
          className="inline-block w-full mt-3 py-2.5 px-4 rounded-[10px] bg-[#49056B] text-white text-xs font-semibold shadow-xs hover:bg-[#5B0785] transition-all text-center"
        >
          Request New Reset Link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center py-2 space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Password Updated Successfully</h2>
          <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
            Your administrator password has been updated. All existing sessions have been terminated for security. You may now sign in.
          </p>
        </div>
        <Link
          href="/admin/login"
          className="inline-block w-full mt-3 py-2.5 px-4 rounded-[10px] bg-[#49056B] text-white text-xs font-semibold shadow-xs hover:bg-[#5B0785] transition-all text-center"
        >
          Proceed to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="p-3 rounded-lg bg-red-50/80 border border-red-200/80 text-xs text-red-800 leading-relaxed flex items-start gap-2"
        >
          <span className="font-semibold shrink-0 text-red-700">Notice:</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label htmlFor="new-password" className="block text-xs font-semibold text-zinc-700 mb-1.5">
          New Password <span className="text-[11px] text-zinc-400 font-normal">(min. 10 chars)</span>
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="new-password"
            minLength={10}
            className="w-full px-3.5 py-2.5 pr-10 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-2.5 p-0.5 text-zinc-400 hover:text-zinc-800 transition-colors focus:outline-none"
          >
            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-xs font-semibold text-zinc-700 mb-1.5">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="new-password"
            minLength={10}
            className="w-full px-3.5 py-2.5 pr-10 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-2.5 p-0.5 text-zinc-400 hover:text-zinc-800 transition-colors focus:outline-none"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 py-2.5 px-4 rounded-[10px] bg-[#49056B] text-white text-xs font-semibold shadow-xs hover:bg-[#5B0785] focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Updating Password...</span>
          </>
        ) : (
          <>
            <Lock className="w-3.5 h-3.5 text-orange-400" />
            <span>Set New Password</span>
          </>
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F7F4] px-4 py-12 font-sans antialiased text-[#202024]">
      <div className="w-full max-w-[400px]">
        {/* Return to login link */}
        <div className="mb-5">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-7 sm:p-9 border border-black/[0.08] shadow-xs">
          {/* Logo & Heading */}
          <div className="flex flex-col items-center text-center mb-6">
            <Link href="/" className="relative h-9 w-40 mb-3 select-none block">
              <Image
                src="/assets/brand/laurrel-logo-primary.png"
                alt="Laurrel Services"
                fill
                sizes="160px"
                className="object-contain"
                priority
              />
            </Link>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900">
              Set New Password
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Choose a strong password for your operations account
            </p>
          </div>

          <Suspense
            fallback={
              <div className="py-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                <span>Loading security parameters...</span>
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>

          {/* Footer note */}
          <div className="mt-7 pt-5 border-t border-black/[0.06] text-center">
            <p className="text-[10px] text-zinc-400 tracking-wider uppercase font-medium">
              Laurrel Services • Ottawa Operations
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
