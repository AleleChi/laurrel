'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION_EASE, MOTION_DURATIONS, VIEWPORT_CONFIG } from '@/utils/motion';
import { getSiteSettingsData, isCmsConfigured } from '@/sanity/client';

interface SiteFooterProps {
  onOpenQuote?: () => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ onOpenQuote }) => {
  const shouldReduceMotion = useReducedMotion();
  const [siteSettings, setSiteSettings] = useState<any>(null);

  useEffect(() => {
    if (isCmsConfigured) {
      getSiteSettingsData()
        .then((res) => {
          if (res?.data) {
            setSiteSettings(res.data);
          }
        })
        .catch(() => {});
    }
  }, []);

  const defaultAboutSummary =
    'Laurrel Services offers residential and commercial cleaning, moving services and storage solutions across Ottawa and surrounding areas. Whether you need help with one service or have several jobs in mind, contact us to discuss your requirements.';

  const rawAbout = siteSettings?.footer?.aboutSummary;
  const aboutSummary =
    !rawAbout ||
    rawAbout.includes('secure storage') ||
    rawAbout.includes('One responsive team')
      ? defaultAboutSummary
      : rawAbout;

  const rawRegion = siteSettings?.footer?.serviceRegionLabel;
  const regionLabel =
    !rawRegion || rawRegion === 'Ottawa & NCR' || rawRegion.includes('NCR')
      ? 'Ottawa & Surrounding Areas'
      : rawRegion;

  const rawEnquiry = siteSettings?.footer?.estimatesLabel;
  const enquiryLabel =
    !rawEnquiry || rawEnquiry === 'Online Request'
      ? 'Request a Quote'
      : rawEnquiry;

  const footerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const footerItemVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 16,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : MOTION_DURATIONS.standard,
        ease: MOTION_EASE,
      },
    },
  };

  return (
    <footer className="w-full bg-[#000000] text-white/80 pt-16 sm:pt-20 lg:pt-24 pb-12 border-t border-white/10">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_CONFIG}
        variants={footerContainerVariants}
        className="max-w-[1380px] mx-auto px-6 sm:px-8 lg:px-12"
      >
        {/* Top Row: Brand Identity + Ottawa Service Information Badges */}
        <motion.div
          variants={footerItemVariants}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-12 border-b border-white/10"
        >
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white block mb-2">
              LAURREL SERVICES
            </span>
            <p className="text-sm sm:text-base text-white/60 max-w-xl">
              Cleaning, moving and storage solutions for homes and businesses in Ottawa and surrounding areas.
            </p>
          </div>

          {/* Regional & Enquiry Information Badges */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            {/* Tile 1: Regional Focus */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#FE6000] text-[#202024] flex items-center justify-center flex-shrink-0 shadow-sm">
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
                  {regionLabel}
                </span>
              </div>
            </div>

            {/* Tile 2: Direct Enquiries */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#FE6000] text-[#202024] flex items-center justify-center flex-shrink-0 shadow-sm">
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
                <button
                  type="button"
                  onClick={onOpenQuote}
                  className="text-sm sm:text-base font-semibold text-white hover:text-[#FE6000] transition-colors text-left"
                >
                  {enquiryLabel}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lower Area: 4 Responsive Columns */}
        <motion.div
          variants={footerItemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 py-12 border-b border-white/10"
        >
          {/* Col 1: About Laurrel (4 cols) */}
          <div className="lg:col-span-4">
            <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-4">
              About Laurrel
            </h4>
            <p className="text-sm leading-relaxed text-white/70 max-w-sm">
              {aboutSummary}
            </p>
          </div>

          {/* Col 2: Useful Links (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-4">
              Useful Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="hover:text-[#FE6000] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE6000] rounded"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/services#cleaning"
                  className="hover:text-[#FE6000] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE6000] rounded"
                >
                  Cleaning Services
                </Link>
              </li>
              <li>
                <Link
                  href="/services#moving"
                  className="hover:text-[#FE6000] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE6000] rounded"
                >
                  Moving Services
                </Link>
              </li>
              <li>
                <Link
                  href="/services#storage"
                  className="hover:text-[#FE6000] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE6000] rounded"
                >
                  Storage Solutions
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#FE6000] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE6000] rounded"
                >
                  About Laurrel
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Our Services (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-4">
              Our Services
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>Residential Cleaning</li>
              <li>Commercial Cleaning</li>
              <li>Moving Services</li>
              <li>Storage Solutions</li>
            </ul>
          </div>

          {/* Col 4: Plan Your Service (3 cols) */}
          <div className="lg:col-span-3 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-4">
                Plan Your Service
              </h4>
              <p className="text-sm text-white/70 leading-relaxed mb-5">
                Planning a clean, a move or looking for storage options? Share a few details about what you need and your preferred date to request a quote.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={onOpenQuote}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-[#FE6000] text-[#202024] font-bold text-sm rounded-full transition-all duration-200 hover:bg-[#E05500] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Request a Quote
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Row: Legal & Copyright */}
        <motion.div
          variants={footerItemVariants}
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50"
        >
          <p>
            {siteSettings?.footer?.copyrightNotice ||
              `© ${new Date().getFullYear()} LAURREL SERVICES. All rights reserved.`}
          </p>
          <div className="flex items-center gap-6">
            <span>Serving Ottawa & Surrounding Areas</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
};
