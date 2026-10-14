'use client';

import React, { useState } from 'react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Hero } from '@/components/home/Hero';
import { ServiceTicker } from '@/components/home/ServiceTicker';
import { AboutSection } from '@/components/home/AboutSection';
import { QuoteInquiryModal } from '@/components/ui/QuoteInquiryModal';

export default function HomePage() {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4]">
      {/* Global Header */}
      <SiteHeader onOpenQuote={() => setIsQuoteModalOpen(true)} />

      {/* Main Experience: Hero, Refined Ticker & About Section */}
      <main className="flex-1">
        <Hero onOpenQuote={() => setIsQuoteModalOpen(true)} />
        <ServiceTicker />
        <AboutSection onOpenQuote={() => setIsQuoteModalOpen(true)} />
      </main>

      {/* Interactive Quote / Planning Inquiry Modal */}
      <QuoteInquiryModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
}
