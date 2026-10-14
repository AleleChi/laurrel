'use client';

import React from 'react';
import Link from 'next/link';

interface SiteFooterProps {
  onOpenQuote?: () => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ onOpenQuote }) => {
  return (
    <footer className="w-full bg-[#202024] text-white/80 py-16 lg:py-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white block mb-3">
                LAURREL SERVICES
              </span>
              <p className="text-sm sm:text-base text-white/70 max-w-sm leading-relaxed mb-6">
                Clean spaces. Smooth moves. Secure storage. Professional service solutions across the Ottawa region.
              </p>
            </div>
            <p className="text-xs text-white/50">
              Ottawa, Ontario · info@laurrelservices.ca
            </p>
          </div>

          {/* Service Links */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold tracking-wider text-white uppercase mb-4">
              Services
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/#cleaning"
                  className="hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8E80B] rounded"
                >
                  Cleaning Services
                </Link>
              </li>
              <li>
                <Link
                  href="/#moving"
                  className="hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8E80B] rounded"
                >
                  Moving Arrangements
                </Link>
              </li>
              <li>
                <Link
                  href="/#storage"
                  className="hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8E80B] rounded"
                >
                  Storage Solutions
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-semibold tracking-wider text-white uppercase mb-4">
              Company
            </h4>
            <ul className="space-y-3 text-sm mb-6">
              <li>
                <Link
                  href="/"
                  className="hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8E80B] rounded"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8E80B] rounded"
                >
                  About Laurrel
                </Link>
              </li>
              {onOpenQuote && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenQuote}
                    className="hover:text-[#C8E80B] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8E80B] rounded text-left"
                  >
                    Request a Quote
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} LAURREL SERVICES. All rights reserved.</p>
          <p>Serving residential and commercial clients across Ottawa, Canada.</p>
        </div>
      </div>
    </footer>
  );
};
