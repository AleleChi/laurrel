'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';

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
          // Account locked
          setErrorMessage(
            data.error ||
              'Account is temporarily locked due to multiple failed login attempts. Please try again later or reset your password.'
          );
        } else if (res.status === 503) {
          // Service temporarily unavailable
          setErrorMessage('Sign-in is temporarily unavailable. Please try again shortly.');
        } else if (res.status === 401 || res.status === 400) {
          // Invalid credentials
          setErrorMessage('Unable to sign in. Check your email and password.');
        } else {
          setErrorMessage('Unable to sign in. Check your email and password.');
        }
        return;
      }

      // Successful login
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setErrorMessage('Sign-in is temporarily unavailable. Please try again shortly.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F7F4] px-4 py-12 font-sans antialiased text-[#202024]">
      <div className="w-full max-w-[400px]">
        {/* Top return link */}
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Website</span>
          </Link>
        </div>

        {/* Refined Login Card */}
        <div className="bg-white rounded-2xl p-7 sm:p-9 border border-black/[0.08] shadow-xs">
          {/* Logo & Heading - Clean, editorial, no decorative pills */}
          <div className="flex flex-col items-center text-center mb-7">
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
              Operations Portal
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Authorized Laurrel administrative access
            </p>
          </div>

          {/* Accessible Error Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-lg bg-red-50/80 border border-red-200/80 text-xs text-red-800 leading-relaxed flex items-start gap-2"
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
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
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
                  className="w-full px-3.5 py-2.5 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:border-transparent transition-all"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-zinc-700"
                >
                  Password
                </label>
                <Link
                  href="/admin/forgot-password"
                  className="text-xs text-[#49056B] hover:text-[#5B0785] font-medium transition-colors"
                >
                  Forgot password?
                </Link>
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
                  className="w-full px-3.5 py-2.5 pr-10 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-2.5 p-0.5 text-zinc-400 hover:text-zinc-800 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-[10px] bg-[#49056B] text-white text-xs font-semibold shadow-xs hover:bg-[#5B0785] focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-orange-400" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

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
