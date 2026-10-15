'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, Plus, Minus, ArrowRight } from 'lucide-react';
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
  const [modalInitialService, setModalInitialService] = useState<
    'cleaning' | 'moving' | 'storage' | 'general'
  >('general');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  const handleOpenQuote = (
    service: 'cleaning' | 'moving' | 'storage' | 'general' = 'general'
  ) => {
    setModalInitialService(service);
    setIsQuoteModalOpen(true);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const getIllustration = (id: string) => {
    switch (id) {
      case 'cleaning':
        return <CleaningIllustration className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 text-[#18181B]" />;
      case 'moving':
        return <MovingIllustration className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 text-[#18181B]" />;
      case 'storage':
        return <StorageIllustration className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 text-[#18181B]" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] text-[#202024] antialiased">
      {/* 1. Global Navigation Header */}
      <SiteHeader onOpenQuote={() => handleOpenQuote('general')} />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* HERO / EDITORIAL HEADER                                  */}
        {/* ========================================================= */}
        <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 px-6 sm:px-8 lg:px-12 xl:px-16 border-b border-[#202024]/10 bg-white">
          <div className="max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center space-x-2 text-xs uppercase tracking-wider text-[#202024]/60 font-semibold">
                <li>
                  <Link href="/" className="hover:text-[#18181B] transition-colors">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true" className="text-[#202024]/30">/</li>
                <li className="text-[#18181B]">Services</li>
              </ol>
            </nav>

            <div className="max-w-4xl">
              <span className="inline-block text-xs sm:text-sm font-bold tracking-[0.15em] uppercase text-[#390044] mb-4">
                OUR SERVICES IN OTTAWA
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-semibold tracking-[-0.03em] text-[#18181B] leading-[1.08] mb-6">
                {content.hero.heading}
              </h1>
              <p className="text-xl sm:text-2xl text-[#390044] font-medium leading-snug mb-5">
                {content.hero.subtitle}
              </p>
              <p className="text-base sm:text-lg text-[#202024]/80 leading-relaxed font-normal max-w-3xl mb-8">
                {content.hero.intro}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => handleOpenQuote('general')}
                  className="group relative inline-flex items-center justify-between gap-5 bg-[#18181B] hover:bg-black text-white pl-7 pr-3 py-2.5 rounded-[50px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B] shadow-sm hover:shadow-md cursor-pointer"
                >
                  <span className="text-[17px] font-medium tracking-tight text-white pr-2 select-none">
                    {content.hero.primaryCta.label}
                  </span>
                  <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center flex-shrink-0 transition-transform duration-250 ease-out group-hover:scale-105">
                    <ArrowRight className="w-4 h-4 text-[#18181B] transform transition-transform duration-250 ease-out group-hover:translate-x-1" />
                  </span>
                </button>

                <a
                  href={content.hero.secondaryCta.href}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-[#202024]/20 hover:border-[#18181B] text-[16px] font-medium text-[#18181B] hover:bg-[#F8F7F4] transition-colors"
                >
                  <span>{content.hero.secondaryCta.label}</span>
                  <ChevronDown className="w-4 h-4 text-[#202024]/60" />
                </a>
              </div>
            </div>

            {/* In-Page Quick Navigation Tabs */}
            <div className="mt-14 pt-8 border-t border-[#202024]/10 flex flex-wrap gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#202024]/50 py-2 mr-2">
                Jump to:
              </span>
              <a
                href="#cleaning"
                className="px-4 py-2 rounded-full border border-[#202024]/15 hover:border-[#18181B] text-sm font-medium hover:bg-[#F8F7F4] transition-colors"
              >
                Cleaning Services &darr;
              </a>
              <a
                href="#moving"
                className="px-4 py-2 rounded-full border border-[#202024]/15 hover:border-[#18181B] text-sm font-medium hover:bg-[#F8F7F4] transition-colors"
              >
                Moving Services &darr;
              </a>
              <a
                href="#storage"
                className="px-4 py-2 rounded-full border border-[#202024]/15 hover:border-[#18181B] text-sm font-medium hover:bg-[#F8F7F4] transition-colors"
              >
                Storage Services &darr;
              </a>
              <a
                href="#how-it-works"
                className="px-4 py-2 rounded-full border border-[#202024]/15 hover:border-[#18181B] text-sm font-medium hover:bg-[#F8F7F4] transition-colors"
              >
                How to Get Started &darr;
              </a>
              <a
                href="#faq"
                className="px-4 py-2 rounded-full border border-[#202024]/15 hover:border-[#18181B] text-sm font-medium hover:bg-[#F8F7F4] transition-colors"
              >
                FAQ &darr;
              </a>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* THREE COMPREHENSIVE SERVICE SECTIONS                     */}
        {/* ========================================================= */}
        <div className="divide-y divide-[#202024]/10">
          {content.services.map((service, idx) => (
            <section
              key={service.id}
              id={service.anchor}
              className={`py-20 lg:py-28 px-6 sm:px-8 lg:px-12 xl:px-16 scroll-mt-24 ${
                idx % 2 === 1 ? 'bg-[#F2F1ED]' : 'bg-[#F8F7F4]'
              }`}
            >
              <div className="max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-20 items-start">
                  {/* Left Column: Eyebrow + H2 + Narrative + Artwork */}
                  <div className="lg:col-span-6 flex flex-col items-start">
                    <span className="text-xs font-bold tracking-widest uppercase text-[#390044] bg-[#390044]/10 px-3.5 py-1.5 rounded-full mb-4">
                      {service.badge}
                    </span>

                    <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold tracking-[-0.03em] text-[#18181B] leading-[1.12] mb-6">
                      {service.headline}
                    </h2>

                    <div className="space-y-4 mb-8">
                      {service.paragraphs.map((p, pIdx) => (
                        <p
                          key={pIdx}
                          className="text-base sm:text-[18px] text-[#202024]/85 leading-relaxed font-normal"
                        >
                          {p}
                        </p>
                      ))}
                    </div>

                    {/* Architectural Artwork Display Container */}
                    <div className="w-full bg-white rounded-2xl border border-[#202024]/10 p-8 sm:p-10 shadow-sm flex items-center justify-center">
                      <div className="flex flex-col items-center text-center">
                        {getIllustration(service.id)}
                        <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#202024]/50">
                          {service.title} &middot; Ottawa, ON
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Planning Details Checklist + CTA */}
                  <div className="lg:col-span-6 flex flex-col items-start pt-2">
                    <div className="w-full bg-white rounded-2xl border border-[#202024]/10 p-8 sm:p-10 shadow-sm">
                      <h3 className="text-2xl sm:text-[26px] font-semibold text-[#18181B] tracking-[-0.02em] mb-4">
                        {service.planningTitle}
                      </h3>

                      <p className="text-base sm:text-[17px] text-[#202024]/80 leading-relaxed mb-6 font-normal">
                        {service.planningIntro}
                      </p>

                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] mb-4">
                        {service.usefulInfoTitle}
                      </h4>

                      <ul className="space-y-3.5 mb-8">
                        {service.usefulInfo.map((info, iIdx) => (
                          <li key={iIdx} className="flex items-start gap-3.5">
                            <span className="w-5 h-5 rounded-full bg-[#C8E80B] text-[#18181B] flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                              &check;
                            </span>
                            <span className="text-[16px] text-[#202024]/85 leading-relaxed font-normal">
                              {info}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* Optional Extra Advisory Note */}
                      {service.extraNote && (
                        <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#202024]/10 mb-8">
                          <p className="text-xs sm:text-sm text-[#202024]/75 leading-relaxed">
                            {service.extraNote}
                          </p>
                        </div>
                      )}

                      {/* CTA Button to open Quote Modal with service preselected */}
                      <button
                        onClick={() => handleOpenQuote(service.id)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#18181B] hover:bg-[#390044] text-white px-7 py-3.5 rounded-full font-medium text-[16px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B] shadow-sm cursor-pointer"
                      >
                        <span>{service.ctaLabel}</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* ========================================================= */}
        {/* HOW TO GET STARTED SECTION                                */}
        {/* ========================================================= */}
        <section
          id="how-it-works"
          aria-label="How to Get Started"
          className="bg-[#390044] text-[#F8F7F4] py-20 lg:py-28 px-6 sm:px-8 lg:px-12 xl:px-16 scroll-mt-24"
        >
          <div className="max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
            <div className="max-w-3xl mb-14 lg:mb-16">
              <span className="inline-block text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-[#C8E80B] mb-3">
                {content.gettingStarted.eyebrow}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] leading-tight text-white">
                {content.gettingStarted.headline}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
              {content.gettingStarted.steps.map((step) => (
                <div
                  key={step.number}
                  className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col justify-between hover:bg-white/10 transition-colors duration-200"
                >
                  <div>
                    <span className="text-[#C8E80B] font-mono text-2xl lg:text-3xl font-bold tracking-tight mb-4 inline-block">
                      {step.number}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-base text-white/75 leading-relaxed font-normal">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* FREQUENTLY ASKED QUESTIONS SECTION (ACCORDION)           */}
        {/* ========================================================= */}
        <section
          id="faq"
          aria-label="Frequently Asked Questions"
          className="bg-[#F8F7F4] py-20 lg:py-28 px-6 sm:px-8 lg:px-12 xl:px-16 scroll-mt-24 border-t border-[#202024]/10"
        >
          <div className="max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              {/* Left Column Heading */}
              <div className="lg:col-span-4 flex flex-col items-start lg:sticky lg:top-28">
                <span className="text-xs sm:text-sm font-bold tracking-[0.14em] uppercase text-[#390044] mb-3">
                  {content.faq.eyebrow}
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-[#18181B] leading-tight mb-6">
                  {content.faq.headline}
                </h2>
                <p className="text-base text-[#202024]/75 leading-relaxed mb-8">
                  Everything you need to know about planning and coordinating cleaning, moving, and storage services in Ottawa.
                </p>
                <button
                  onClick={() => handleOpenQuote('general')}
                  className="inline-flex items-center gap-3 bg-[#18181B] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors cursor-pointer"
                >
                  <span>Have another question?</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Right Column Accordion Items */}
              <div className="lg:col-span-8 flex flex-col divide-y divide-[#202024]/10 border-y border-[#202024]/10">
                {content.faq.items.map((faqItem, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div key={index} className="py-6 sm:py-7">
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full text-left flex items-start justify-between gap-6 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B] rounded-lg"
                        aria-expanded={isOpen}
                      >
                        <h3 className="text-lg sm:text-xl font-semibold text-[#18181B] tracking-tight leading-snug">
                          {faqItem.question}
                        </h3>
                        <span className="w-8 h-8 rounded-full border border-[#202024]/20 flex items-center justify-center flex-shrink-0 text-[#18181B] mt-0.5 transition-colors">
                          {isOpen ? (
                            <Minus className="w-4 h-4 text-[#18181B]" />
                          ) : (
                            <Plus className="w-4 h-4 text-[#18181B]" />
                          )}
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{
                              height: 'auto',
                              opacity: 1,
                              transition: {
                                height: { duration: shouldReduceMotion ? 0.05 : 0.28, ease: 'easeOut' },
                                opacity: { duration: shouldReduceMotion ? 0.05 : 0.24, delay: 0.05 },
                              },
                            }}
                            exit={{
                              height: 0,
                              opacity: 0,
                              transition: {
                                height: { duration: shouldReduceMotion ? 0.05 : 0.22, ease: 'easeIn' },
                                opacity: { duration: shouldReduceMotion ? 0.05 : 0.15 },
                              },
                            }}
                            className="overflow-hidden"
                          >
                            <p className="text-base sm:text-[17px] text-[#202024]/85 leading-relaxed pt-4 pr-12 font-normal">
                              {faqItem.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* CLOSING LIME BANNER CALL TO ACTION                        */}
        {/* ========================================================= */}
        <section
          aria-label="Ready to Get Started"
          className="bg-[#C8E80B] text-[#18181B] py-20 lg:py-24 px-6 sm:px-8 lg:px-12 xl:px-16 border-t border-[#202024]/10"
        >
          <div className="max-w-[1440px] 2xl:max-w-[1560px] mx-auto text-center flex flex-col items-center">
            <span className="text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-[#18181B]/80 mb-4">
              {content.finalCta.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-semibold tracking-[-0.03em] leading-tight max-w-2xl mb-5">
              {content.finalCta.headline}
            </h2>
            <p className="text-base sm:text-lg text-[#18181B]/85 max-w-xl leading-relaxed mb-9">
              {content.finalCta.body}
            </p>
            <button
              onClick={() => handleOpenQuote('general')}
              className="inline-flex items-center gap-3 bg-[#18181B] hover:bg-[#390044] text-white px-8 py-4 rounded-full font-medium text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B] shadow-sm cursor-pointer"
            >
              <span>{content.finalCta.ctaLabel}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <SiteFooter onOpenQuote={() => handleOpenQuote('general')} />

      {/* Interactive Planning / Quote Inquiry Modal */}
      <QuoteInquiryModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        initialService={modalInitialService}
      />
    </div>
  );
};
