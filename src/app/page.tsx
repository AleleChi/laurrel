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
  const [quoteServices, setQuoteServices] = useState<('cleaning' | 'moving' | 'storage')[] | undefined>(undefined);

  const handleOpenQuote = (services?: ('cleaning' | 'moving' | 'storage')[]) => {
    setQuoteServices(services);
    setIsQuoteModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4]">
      {/* Global Header */}
      <SiteHeader onOpenQuote={() => handleOpenQuote()} />

      {/* Main Experience: Hero, Ticker, About, Services Highlight, Overlapping Plans, Request Quote, FAQs & Contact */}
      <main className="flex-1">
        <Hero onOpenQuote={() => handleOpenQuote()} />
        <ServiceTicker />
        <AboutSection onOpenQuote={() => handleOpenQuote()} />
        <ServicesHighlightSection />
        <WhenPlansOverlapSection onOpenQuote={handleOpenQuote} />
        <RequestQuoteSection onOpenQuote={() => handleOpenQuote()} />
        <HomeFaqSection />
        <HomeContactSection />
      </main>

      {/* Global Laurrel Footer */}
      <SiteFooter onOpenQuote={() => handleOpenQuote()} />

      {/* Interactive Quote / Planning Inquiry Modal */}
      <QuoteInquiryModal
        isOpen={isQuoteModalOpen}
        onClose={() => {
          setIsQuoteModalOpen(false);
          setQuoteServices(undefined);
        }}
        initialServices={quoteServices}
      />
    </div>
  );
}
