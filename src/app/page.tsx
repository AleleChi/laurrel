'use client';

import React, { useState } from 'react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Hero } from '@/components/home/Hero';
import { ServiceTicker } from '@/components/home/ServiceTicker';
import { AboutSection } from '@/components/home/AboutSection';
import { ServicesHighlightSection } from '@/components/home/ServicesHighlightSection';
import { WhenPlansOverlapSection } from '@/components/home/WhenPlansOverlapSection';
import { RequestQuoteSection } from '@/components/home/RequestQuoteSection';
import { HomeFaqSection } from '@/components/home/HomeFaqSection';
import { HomeContactSection } from '@/components/home/HomeContactSection';
import { QuoteInquiryModal } from '@/components/ui/QuoteInquiryModal';

export default function HomePage() {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4]">
      {/* Global Header */}
      <SiteHeader onOpenQuote={() => setIsQuoteModalOpen(true)} />

      {/* Main Experience: Hero, Ticker, About, Services Highlight, Overlapping Plans, Request Quote, FAQs & Contact */}
      <main className="flex-1">
        <Hero onOpenQuote={() => setIsQuoteModalOpen(true)} />
        <ServiceTicker />
        <AboutSection onOpenQuote={() => setIsQuoteModalOpen(true)} />
        <ServicesHighlightSection />
        <WhenPlansOverlapSection onOpenQuote={() => setIsQuoteModalOpen(true)} />
        <RequestQuoteSection onOpenQuote={() => setIsQuoteModalOpen(true)} />
        <HomeFaqSection />
        <HomeContactSection onOpenQuote={() => setIsQuoteModalOpen(true)} />
      </main>

      {/* Global Laurrel Footer */}
      <SiteFooter onOpenQuote={() => setIsQuoteModalOpen(true)} />

      {/* Interactive Quote / Planning Inquiry Modal */}
      <QuoteInquiryModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
}
