'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, Minus, ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { PageBanner } from '@/components/layout/PageBanner';
import { ServiceSidebarNav } from '@/components/services/ServiceSidebarNav';
import { SidebarEnquiryForm, ServiceOption } from '@/components/services/SidebarEnquiryForm';
import { SidebarInfoPanel } from '@/components/services/SidebarInfoPanel';
import { QuoteInquiryModal } from '@/components/ui/QuoteInquiryModal';
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
  const [sidebarServiceContext, setSidebarServiceContext] = useState<ServiceOption | 'all'>('cleaning');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  const handleOpenQuote = (
    service: 'cleaning' | 'moving' | 'storage' | 'general' = 'general'
  ) => {
    setModalInitialService(service);
    setIsQuoteModalOpen(true);
  };

  const handleEnquireService = (service: 'cleaning' | 'moving' | 'storage') => {
    setSidebarServiceContext(service);
    const formEl = document.getElementById('sidebar-enquiry-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const nameInput = formEl.querySelector('input[name="name"]') as HTMLInputElement | null;
      if (nameInput) {
        setTimeout(() => nameInput.focus(), 400);
      }
    } else {
      handleOpenQuote(service);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] text-[#202024] antialiased">
      {/* 1. Global Floating Navigation Header */}
      <SiteHeader onOpenQuote={() => handleOpenQuote('general')} />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* REUSABLE FULL-BLEED PHOTOGRAPHIC PAGE BANNER              */}
        {/* ========================================================= */}
        <PageBanner
          title={content.banner.title}
          breadcrumb={content.banner.breadcrumb}
          imageSrc={content.banner.imageSrc}
          altText={content.banner.altText}
          pillBreadcrumb={true}
        />

        {/* ========================================================= */}
        {/* STAGE A: SERVICE DETAILS & STICKY NAVIGATION              */}
        {/* Left: Navigation panel sticky during service scroll (~30.7%) */}
        {/* Right: Main editorial article + 3 service topics (~69.3%) */}
        {/* ========================================================= */}
        <div className="w-full pt-16 sm:pt-20 lg:pt-24 pb-12 sm:pb-16 px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-[1400px] xl:max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
              
              {/* Left Column: Service Navigation (Sticky within Stage A) */}
              <aside className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-28 xl:top-32 self-start">
                <ServiceSidebarNav />
              </aside>

              {/* Right Column: Main Service Article */}
              <article className="lg:col-span-8 xl:col-span-8 flex flex-col space-y-16 lg:space-y-20">
                
                {/* Introduction Block */}
                <div className="flex flex-col items-start pt-1">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-medium text-white tracking-[-0.03em] leading-[1.1] mb-6 sm:mb-8">
                    {content.articleIntro.h2}
                  </h2>
                  <div className="space-y-4 text-lg sm:text-[19px] text-[#202024]/85 leading-relaxed font-normal">
                    <p>{content.articleIntro.paragraph1}</p>
                    <p>{content.articleIntro.paragraph2}</p>
                  </div>
                  <hr className="w-full mt-12 border-[#202024]/10" />
                </div>

                {/* 3 Detailed Service Topics (Cleaning, Moving, Storage) */}
                {content.services.map((service) => (
                  <section
                    key={service.id}
                    id={service.anchor}
                    className="scroll-mt-28 lg:scroll-mt-32 flex flex-col items-start"
                  >
                    {/* Eyebrow Label */}
                    <span className="text-xs font-bold tracking-widest uppercase text-[#49056B] mb-3">
                      {service.badge}
                    </span>

                    {/* Section Headline (H2) */}
                    <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-semibold text-[#18181B] tracking-[-0.025em] leading-[1.15] mb-6">
                      {service.headline}
                    </h2>

                    {/* Narrative Paragraphs */}
                    <div className="space-y-4 text-base sm:text-lg text-[#202024]/85 leading-relaxed font-normal mb-8">
                      {service.paragraphs.map((p, pIdx) => (
                        <p key={pIdx}>{p}</p>
                      ))}
                    </div>

                    {/* Substantial Horizontal Service Photograph */}
                    <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[450px] rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-sm mb-10 bg-[#202024]/5">
                      <Image
                        src={service.imageSrc}
                        alt={service.imageAlt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 930px"
                        className="object-cover object-center"
                      />
                    </div>

                    {/* Supporting Subsection */}
                    <div className="w-full bg-white rounded-[28px] sm:rounded-[32px] p-8 sm:p-10 border border-[#202024]/10 shadow-xs mb-8">
                      <h3 className="text-xl sm:text-2xl font-semibold text-[#18181B] tracking-tight mb-4">
                        {service.planningTitle}
                      </h3>
                      <p className="text-base sm:text-[17px] text-[#202024]/80 leading-relaxed mb-6 font-normal">
                        {service.planningIntro}
                      </p>

                      {/* Semantic Information Checklist */}
                      <ul className="space-y-3.5 mb-8">
                        {service.usefulInfo.map((item, iIdx) => (
                          <li key={iIdx} className="flex items-start gap-3.5 text-base sm:text-[17px] text-[#202024]/85 font-normal">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#18181B] flex-shrink-0 mt-2.5" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Optional Extra Note */}
                      {service.extraNote && (
                        <div className="p-4 rounded-2xl bg-[#F8F7F4] border border-[#202024]/8 text-xs sm:text-sm text-[#202024]/75 leading-relaxed mb-8">
                          {service.extraNote}
                        </div>
                      )}

                      {/* Contextual CTA Button focusing the enquiry form */}
                      <button
                        onClick={() => handleEnquireService(service.id as any)}
                        className="inline-flex items-center gap-3 bg-[#18181B] hover:bg-[#49056B] text-white px-7 py-3.5 rounded-full font-medium text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B] shadow-sm cursor-pointer"
                      >
                        <span>{service.ctaLabel}</span>
                        <ArrowRight className="w-4 h-4 text-[#18181B]" />
                      </button>
                    </div>

                    <hr className="w-full mt-4 border-[#202024]/10" />
                  </section>
                ))}
              </article>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* STAGE B: COORDINATED SIDEBAR & EXTENDED SECTIONS          */}
        {/* Left: Enquiry Form + Lime Information Panel               */}
        {/* Right: How It Works + Frequently Asked Questions          */}
        {/* ========================================================= */}
        <div className="w-full pt-4 pb-20 sm:pb-24 lg:pb-28 px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-[1400px] xl:max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
              
              {/* 1. SIDEBAR ENQUIRY FORM (Mobile: Order 1, Desktop: Col 1-4 Row 1) */}
              <div className="order-1 lg:order-none lg:col-span-4 lg:row-start-1">
                <SidebarEnquiryForm
                  heading={content.sidebarForm.heading}
                  supportingText={content.sidebarForm.supportingText}
                  submitButtonText={content.sidebarForm.submitButtonText}
                  serviceContext={sidebarServiceContext}
                  onServiceContextChange={setSidebarServiceContext}
                />
              </div>

              {/* 2. HOW IT WORKS (Mobile: Order 2, Desktop: Col 5-12 Row 1) */}
              <section
                id="how-it-works"
                className="order-2 lg:order-none lg:col-span-8 lg:row-start-1 scroll-mt-28 lg:scroll-mt-32 flex flex-col items-start"
              >
                <span className="text-xs font-bold tracking-widest uppercase text-[#49056B] mb-3">
                  {content.gettingStarted.eyebrow}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-semibold text-[#18181B] tracking-[-0.025em] leading-[1.15] mb-4">
                  {content.gettingStarted.headline}
                </h2>
                <p className="text-base sm:text-lg text-[#202024]/75 mb-8 font-normal">
                  Three practical stages to plan, confirm, and complete your Ottawa service enquiry.
                </p>

                {/* 3 Interactive Process Cards (Hover/Focus-driven Solshine highlight) */}
                <div className="w-full space-y-4">
                  {content.gettingStarted.steps.map((step, idx) => {
                    const isActive = activeStepIndex === idx;
                    return (
                      <div
                        key={step.number}
                        tabIndex={0}
                        role="region"
                        aria-label={step.title}
                        onMouseEnter={() => setActiveStepIndex(idx)}
                        onFocus={() => setActiveStepIndex(idx)}
                        className={`group cursor-default rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 border transition-all duration-300 ease-out flex flex-col sm:flex-row items-start sm:items-center gap-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B] ${
                          isActive
                            ? 'bg-[#49056B] border-[#49056B] shadow-sm text-white'
                            : 'bg-white border-[#202024]/10 text-[#202024] hover:border-[#202024]/20'
                        }`}
                      >
                        <div
                          className={`w-14 h-14 rounded-2xl font-mono text-xl font-bold flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                            isActive
                              ? 'bg-[#FE6000] text-[#18181B]'
                              : 'bg-[#F2F1ED] text-[#18181B] group-hover:bg-[#18181B] group-hover:text-white'
                          }`}
                        >
                          {step.number}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg sm:text-xl font-semibold tracking-tight mb-1.5 ${isActive ? 'text-white' : 'text-[#18181B]'}`}>
                            {step.title}
                          </h3>
                          <p
                            className={`text-base leading-relaxed font-normal transition-colors duration-300 ${
                              isActive ? 'text-white/85' : 'text-[#202024]/80'
                            }`}
                          >
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <hr className="w-full mt-14 border-[#202024]/10" />
              </section>

              {/* 3. SIDEBAR LIME INFO PANEL (Mobile: Order 3, Desktop: Col 1-4 Row 2) */}
              <div className="order-3 lg:order-none lg:col-span-4 lg:row-start-2 pt-2">
                <SidebarInfoPanel
                  heading={content.sidebarInfoPanel.heading}
                  body={content.sidebarInfoPanel.body}
                  ctaText={content.sidebarInfoPanel.ctaText}
                  onOpenQuote={() => handleOpenQuote('general')}
                />
              </div>

              {/* 4. FREQUENTLY ASKED QUESTIONS (Mobile: Order 4, Desktop: Col 5-12 Row 2) */}
              <section
                id="faq"
                className="order-4 lg:order-none lg:col-span-8 lg:row-start-2 scroll-mt-28 lg:scroll-mt-32 flex flex-col items-start pt-2"
              >
                <span className="text-xs font-bold tracking-widest uppercase text-[#49056B] mb-3">
                  {content.faq.eyebrow}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-semibold text-[#18181B] tracking-[-0.025em] leading-[1.15] mb-8">
                  {content.faq.headline}
                </h2>

                <div className="w-full divide-y divide-[#202024]/10 border-y border-[#202024]/10 bg-white rounded-[28px] px-6 sm:px-8 shadow-xs">
                  {content.faq.items.map((faqItem, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div key={index} className="py-6">
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
                              <p className="text-base sm:text-[17px] text-[#202024]/85 leading-relaxed pt-4 pr-10 font-normal">
                                {faqItem.answer}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </section>

            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CLOSING LIME BANNER CALL TO ACTION                        */}
        {/* ========================================================= */}
        <section
          aria-label="Ready to Get Started"
          className="bg-[#49056B] text-white py-20 lg:py-24 px-6 sm:px-8 lg:px-12 xl:px-16 border-t border-black/10"
        >
          <div className="max-w-[1400px] xl:max-w-[1440px] 2xl:max-w-[1560px] mx-auto text-center flex flex-col items-center">
            <span className="text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-[#FE6000] mb-4">
              {content.finalCta.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-semibold tracking-[-0.03em] leading-tight max-w-2xl mb-5">
              {content.finalCta.headline}
            </h2>
            <p className="text-base sm:text-lg text-white/85 max-w-xl leading-relaxed mb-9">
              {content.finalCta.body}
            </p>
            <button
              onClick={() => handleOpenQuote('general')}
              className="inline-flex items-center gap-3 bg-[#FE6000] hover:bg-[#E05500] text-[#18181B] px-8 py-4 rounded-full font-bold text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FE6000] shadow-sm cursor-pointer"
            >
              <span>{content.finalCta.ctaLabel}</span>
              <ArrowRight className="w-4 h-4 text-[#18181B]" />
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
