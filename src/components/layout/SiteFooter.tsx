'use client';

import React from 'react';
import Link from 'next/link';

interface SiteFooterProps {
  onOpenQuote?: () => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ onOpenQuote }) => {
  return (
    <footer className="w-full bg-[#0B0B0E] text-white/80 pt-16 lg:pt-20 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Top Row: Brand Identity + Lime-Backed Contact Tiles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-12 border-b border-white/10">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white block mb-2">
              LAURREL SERVICES
            </span>
            <p className="text-sm sm:text-base text-white/60">
              Clean spaces. Smooth moves. Secure storage in Ottawa.
            </p>
          </div>

          {/* Contact Blocks with Lime-Backed Icon Tiles */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            {/* Phone */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#C8E80B] text-[#202024] flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg
                  className="w-5 h-5 stroke-current stroke-[2] fill-none"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-white/50 block font-medium">
                  Direct Line
                </span>
                <a
                  href="tel:+16135550198"
                  className="text-sm sm:text-base font-semibold text-white hover:text-[#C8E80B] transition-colors"
                >
                  (613) 555-0198
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#C8E80B] text-[#202024] flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg
                  className="w-5 h-5 stroke-current stroke-[2] fill-none"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-white/50 block font-medium">
                  Enquiries
                </span>
                <a
                  href="mailto:info@laurrelservices.ca"
                  className="text-sm sm:text-base font-semibold text-white hover:text-[#C8E80B] transition-colors"
                >
                  info@laurrelservices.ca
                </a>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#C8E80B] text-[#202024] flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg
                  className="w-5 h-5 stroke-current stroke-[2] fill-none"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-white/50 block font-medium">
                  Service Region
                </span>
                <span className="text-sm sm:text-base font-semibold text-white">
                  Ottawa, Ontario
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Area: 4 Responsive Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 py-12 border-b border-white/10">
          {/* Col 1: About Laurrel (4 cols) */}
          <div className="lg:col-span-4">
            <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-4">
              About Laurrel
            </h4>
            <p className="text-sm leading-relaxed text-white/70 max-w-sm mb-4">
              Laurrel Services coordinates residential and commercial cleaning, careful moving, and secure storage arrangements across Ottawa and the surrounding National Capital Region.
            </p>
            <p className="text-xs text-white/50">
              One responsive team for multiple related service needs.
            </p>
          </div>

          {/* Col 2: Useful Links (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-4">
              Useful Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="hover:text-[#C8E80B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8E80B] rounded"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/#cleaning"
                  className="hover:text-[#C8E80B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8E80B] rounded"
                >
                  Cleaning Services
                </Link>
              </li>
              <li>
                <Link
                  href="/#moving"
                  className="hover:text-[#C8E80B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8E80B] rounded"
                >
                  Moving Services
                </Link>
              </li>
              <li>
                <Link
                  href="/#storage"
                  className="hover:text-[#C8E80B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8E80B] rounded"
                >
                  Storage Solutions
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#C8E80B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8E80B] rounded"
                >
                  About Laurrel
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Service Hours (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-4">
              Service Hours
            </h4>
            <div className="space-y-2 text-sm text-white/75">
              <p className="flex justify-between max-w-[240px]">
                <span>Monday – Friday:</span>
                <span className="text-white font-medium">8:00 AM – 6:00 PM</span>
              </p>
              <p className="flex justify-between max-w-[240px]">
                <span>Saturday:</span>
                <span className="text-white font-medium">9:00 AM – 5:00 PM</span>
              </p>
              <p className="flex justify-between max-w-[240px]">
                <span>Sunday:</span>
                <span className="text-white font-medium">By appointment</span>
              </p>
            </div>
            <p className="text-xs text-white/50 mt-4">
              Weekend moves and turnover cleans scheduled on request.
            </p>
          </div>

          {/* Col 4: Plan Your Service (3 cols) */}
          <div className="lg:col-span-3 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-4">
                Plan Your Service
              </h4>
              <p className="text-sm text-white/70 leading-relaxed mb-5">
                Ready to plan your move, handover clean, or storage arrangement? Tell us what you need.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={onOpenQuote}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-[#C8E80B] text-[#202024] font-bold text-sm rounded-full transition-all duration-200 hover:bg-[#b5d309] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Request a Quote
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: Legal & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} LAURREL SERVICES. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Serving Ottawa & Eastern Ontario</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
