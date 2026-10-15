'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { QuoteInquiryModal } from '@/components/ui/QuoteInquiryModal';
import {
  CleaningIllustration,
  MovingIllustration,
  StorageIllustration,
} from '@/components/icons/services';
import { siteConfig, ServicesPageConfig } from '@/content/site';

interface ServicesPageClientProps {
  content?: ServicesPageConfig;
}

export const ServicesPageClient: React.FC<ServicesPageClientProps> = ({
  content = siteConfig.servicesPage,
}) => {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const getIllustration = (id: string) => {
    switch (id) {
      case 'cleaning':
        return <CleaningIllustration className="w-28 h-28 lg:w-32 lg:h-32 text-[#18181B]" />;
      case 'moving':
        return <MovingIllustration className="w-28 h-28 lg:w-32 lg:h-32 text-[#18181B]" />;
      case 'storage':
        return <StorageIllustration className="w-28 h-28 lg:w-32 lg:h-32 text-[#18181B]" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] text-[#202024] antialiased">
      {/* 1. Global Navigation Header */}
      <SiteHeader onOpenQuote={() => setIsQuoteModalOpen(true)} />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* HERO / BANNER HEADER                                      */}
        {/* ========================================================= */}
        <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 px-6 sm:px-8 lg:px-12 xl:px-16 border-b border-[#202024]/10 bg-white">
          <div className="max-w-[1440px] mx-auto">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center space-x-2 text-xs uppercase tracking-wider text-[#202024]/60 font-semibold">
                <li>
                  <Link href="/" className="hover:text-[#18181B] transition-colors">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-[#18181B]">Services</li>
              </ol>
            </nav>

            <div className="max-w-4xl">
              <span className="inline-block text-xs sm:text-sm font-bold tracking-[0.14em] uppercase text-[#390044] mb-4">
                OUR SERVICES IN OTTAWA
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#18181B] leading-[1.08] mb-6">
                {content.heading}
              </h1>
              <p className="text-lg sm:text-xl text-[#202024]/80 leading-relaxed font-normal max-w-3xl">
                {content.intro}
              </p>
            </div>

            {/* Quick In-Page Anchor Navigation */}
            <div className="mt-10 pt-6 border-t border-[#202024]/10 flex flex-wrap gap-3">
              <a
                href="#cleaning"
                className="px-4 py-2 rounded-full border border-[#202024]/20 hover:border-[#18181B] text-sm font-medium hover:bg-[#F8F7F4] transition-colors"
              >
                Cleaning Services &darr;
              </a>
              <a
                href="#moving"
                className="px-4 py-2 rounded-full border border-[#202024]/20 hover:border-[#18181B] text-sm font-medium hover:bg-[#F8F7F4] transition-colors"
              >
                Moving Services &darr;
              </a>
              <a
                href="#storage"
                className="px-4 py-2 rounded-full border border-[#202024]/20 hover:border-[#18181B] text-sm font-medium hover:bg-[#F8F7F4] transition-colors"
              >
                Storage Options &darr;
              </a>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* DETAILED SERVICE SECTIONS                                 */}
        {/* ========================================================= */}
        <div className="divide-y divide-[#202024]/10">
          {content.sections.map((section, idx) => (
            <section
              key={section.id}
              id={section.anchor}
              className={`py-20 lg:py-28 px-6 sm:px-8 lg:px-12 xl:px-16 scroll-mt-24 ${
                idx % 2 === 1 ? 'bg-[#F2F1ED]' : 'bg-[#F8F7F4]'
              }`}
            >
              <div className="max-w-[1440px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                  {/* Left Column: Badge, Title & Artwork */}
                  <div className="lg:col-span-5 flex flex-col items-start">
                    <span className="text-xs font-bold tracking-widest uppercase text-[#390044] bg-[#390044]/10 px-3 py-1 rounded-full mb-4">
                      {section.badge}
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-[#18181B] leading-tight mb-6">
                      {section.title}
                    </h2>

                    <div className="p-8 rounded-2xl bg-white border border-[#202024]/10 shadow-sm flex items-center justify-center w-full max-w-sm mt-4">
                      {getIllustration(section.id)}
                    </div>
                  </div>

                  {/* Right Column: Narrative, Practical Checklist & CTA */}
                  <div className="lg:col-span-7 flex flex-col items-start pt-2">
                    <p className="text-lg sm:text-xl text-[#202024]/90 font-normal leading-relaxed mb-8">
                      {section.summary}
                    </p>

                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#18181B] mb-4">
                      Key Service Capabilities
                    </h3>

                    <ul className="space-y-4 mb-10 w-full">
                      {section.details.map((point, i) => (
                        <li key={i} className="flex items-start gap-3.5">
                          <span className="w-5 h-5 rounded-full bg-[#C8E80B] text-[#18181B] flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                            &check;
                          </span>
                          <span className="text-base sm:text-[17px] text-[#202024]/85 leading-relaxed font-normal">
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => setIsQuoteModalOpen(true)}
                      className="inline-flex items-center gap-3 bg-[#18181B] hover:bg-[#390044] text-white px-7 py-3.5 rounded-full font-medium text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B] shadow-sm cursor-pointer"
                    >
                      <span>{section.ctaLabel}</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* ========================================================= */}
        {/* CLOSING EDITORIAL CALL TO ACTION                          */}
        {/* ========================================================= */}
        <section className="bg-[#390044] text-[#F8F7F4] py-20 lg:py-24 px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-[1440px] mx-auto text-center flex flex-col items-center">
            <span className="text-xs sm:text-sm font-bold tracking-[0.15em] uppercase text-[#C8E80B] mb-4">
              START YOUR ENQUIRY
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight max-w-2xl mb-6">
              Tell us what you need done.
            </h2>
            <p className="text-base sm:text-lg text-white/80 max-w-xl leading-relaxed mb-8">
              Whether you need one specific service or multiple services coordinated for your Ottawa move, share your details to receive an initial quote.
            </p>
            <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="inline-flex items-center gap-3 bg-[#C8E80B] hover:bg-white text-[#18181B] px-8 py-4 rounded-full font-semibold text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C8E80B] cursor-pointer"
            >
              <span>Request a Quote</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <SiteFooter onOpenQuote={() => setIsQuoteModalOpen(true)} />

      {/* Quote / Inquiry Modal */}
      <QuoteInquiryModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
};
