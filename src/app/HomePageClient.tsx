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
import { siteConfig } from '@/content/site';

interface HomePageClientProps {
  initialData?: {
    hero?: typeof siteConfig.hero;
    ticker?: typeof siteConfig.ticker;
    about?: typeof siteConfig.about;
    servicesHighlight?: typeof siteConfig.servicesHighlight;
    overlappingPlans?: typeof siteConfig.overlappingPlans;
    requestQuote?: typeof siteConfig.requestQuoteSection;
    faq?: typeof siteConfig.homeFaq;
    contact?: typeof siteConfig.homeContact;
  };
}

export function HomePageClient({ initialData }: HomePageClientProps) {
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
        <Hero onOpenQuote={() => handleOpenQuote()} initialData={initialData?.hero} />
        <ServiceTicker />
        <AboutSection onOpenQuote={() => handleOpenQuote()} initialData={initialData?.about} />
        <ServicesHighlightSection content={initialData?.servicesHighlight} />
        <WhenPlansOverlapSection content={initialData?.overlappingPlans} onOpenQuote={handleOpenQuote} />
        <RequestQuoteSection content={initialData?.requestQuote} onOpenQuote={() => handleOpenQuote()} />
        <HomeFaqSection content={initialData?.faq} />
        <HomeContactSection content={initialData?.contact} />
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
