'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

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
      <div className="text-center py-4 space-y-4">
        <div className="w-11 h-11 rounded-md bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-900">Missing Reset Token</h2>
          <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
            The password reset link appears incomplete or malformed. Please use the link provided in your email or request a new one.
          </p>
        </div>
        <Link
          href="/admin/forgot-password"
          className="inline-flex items-center justify-center w-full h-11 px-4 rounded-md bg-[#49056B] text-white text-sm font-semibold hover:bg-[#390044] transition-colors text-center"
        >
          Request New Reset Link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-11 h-11 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-900">Password Updated Successfully</h2>
          <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
            Your administrator account credentials have been updated securely. You can now sign in with your new password.
          </p>
        </div>
        <Link
          href="/admin/login"
          className="inline-flex items-center justify-center w-full h-11 px-4 rounded-md bg-[#49056B] text-white text-sm font-semibold hover:bg-[#390044] transition-colors text-center"
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
          className="mb-4 p-3.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed flex items-start gap-2.5"
        >
          <span className="font-semibold shrink-0 text-red-700">Notice:</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="new-password"
          className="block text-[13px] font-medium text-zinc-700 mb-1.5"
        >
          New Password (min 10 characters) <span className="text-red-500">*</span>
        </label>
        <div className="relative flex items-center">
          <input
            id="new-password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="new-password"
            className="w-full h-11 px-3.5 pr-11 bg-white border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 p-1 text-zinc-400 hover:text-zinc-700 transition-colors focus:outline-none"
          >
            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="block text-[13px] font-medium text-zinc-700 mb-1.5"
        >
          Confirm New Password <span className="text-red-500">*</span>
        </label>
        <div className="relative flex items-center">
          <input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="new-password"
            className="w-full h-11 px-3.5 pr-11 bg-white border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 p-1 text-zinc-400 hover:text-zinc-700 transition-colors focus:outline-none"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 mt-2 rounded-md bg-[#49056B] text-white text-sm font-semibold hover:bg-[#390044] focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:ring-offset-1 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Updating password...</span>
          </>
        ) : (
          <span>Update password</span>
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white text-[#202024] font-sans antialiased selection:bg-[#49056B] selection:text-white">
      {/* LEFT: Stexo-Inspired Geometric Brand Panel */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 relative bg-[#390044] text-white p-12 xl:p-16 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#49056B]/40 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-20 w-80 h-80 bg-purple-900/40 rounded-3xl rotate-45 transform" />
          <div className="absolute -bottom-20 left-10 w-96 h-96 bg-[#25002D] rounded-3xl -rotate-12 border border-purple-800/20" />
          <svg
            className="absolute inset-0 w-full h-full opacity-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="stexo-grid-rp" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stexo-grid-rp)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/15">
              <ShieldCheck className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-purple-200">
                Staff Operations Portal
              </span>
              <p className="text-xs text-white/70">Password Security</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/10 text-xs font-medium text-purple-200 mb-6 border border-white/15">
            Credential Update
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Create a New Password
          </h2>

          <p className="text-sm text-purple-200/80 mt-4 leading-relaxed max-w-md">
            Choose a strong password with at least 10 characters to secure your administrative portal access.
          </p>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-purple-200/70">
          <span>LAURREL SERVICES • Operations</span>
          <span>Ottawa, ON</span>
        </div>
      </div>

      {/* RIGHT: Dribbble-Inspired Balanced Authentication Surface */}
      <div className="col-span-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16 min-h-screen">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-[#49056B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Sign In</span>
          </Link>
          <span className="text-xs text-zinc-400 hidden sm:inline-block">Staff Security</span>
        </div>

        <div className="w-full max-w-[420px] mx-auto py-8">
          <div className="mb-8">
            <div className="mb-6">
              <Logo priority />
            </div>
            <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-zinc-900">
              Choose a new password
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Create a strong password for your administrator account.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#49056B]" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>

        <div className="text-center text-xs text-zinc-400 py-4 border-t border-zinc-100">
          <p>© {new Date().getFullYear()} Laurrel Services. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
