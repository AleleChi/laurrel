'use client';

import React, { useState } from 'react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { AboutHeroBanner } from '@/components/about/AboutHeroBanner';
import { AboutIntroduction } from '@/components/about/AboutIntroduction';
import { AboutServices } from '@/components/about/AboutServices';
import { AboutStart } from '@/components/about/AboutStart';
import { AboutLocation } from '@/components/about/AboutLocation';
import { AboutFinalCta } from '@/components/about/AboutFinalCta';
import { QuoteInquiryModal } from '@/components/ui/QuoteInquiryModal';
import { AboutPageConfig } from '@/content/site';

interface AboutPageClientProps {
  content: AboutPageConfig;
}

export const AboutPageClient: React.FC<AboutPageClientProps> = ({ content }) => {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4]">
      {/* Persistent Global Header */}
      <SiteHeader onOpenQuote={() => setIsQuoteModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* C1. Image Breadcrumb Hero Banner */}
        <AboutHeroBanner
          title={content.hero.title}
          breadcrumb={content.hero.breadcrumb}
          imageSrc={content.hero.imageSrc}
          altText={content.hero.altText}
        />

        {/* C2. Main Introduction: Our Company */}
        <AboutIntroduction
          label={content.intro.label}
          headline={content.intro.headline}
          paragraphs={content.intro.paragraphs}
          imageSrc={content.intro.imageSrc}
          altText={content.intro.altText}
        />

        {/* C3. What We Do: Our Work */}
        <AboutServices
          label={content.work.label}
          headline={content.work.headline}
          intro={content.work.intro}
          services={content.work.services}
        />

        {/* C4. How to Start: Getting Started */}
        <AboutStart
          label={content.start.label}
          headline={content.start.headline}
          paragraph={content.start.paragraph}
          closingLine={content.start.closingLine}
        />

        {/* C5. Service Location: Where We Work */}
        <AboutLocation
          label={content.location.label}
          headline={content.location.headline}
          body={content.location.body}
        />

        {/* C6. Final Closing CTA */}
        <AboutFinalCta
          headline={content.finalCta.headline}
          body={content.finalCta.body}
          ctaLabel={content.finalCta.ctaLabel}
          onOpenQuote={() => setIsQuoteModalOpen(true)}
        />
      </main>

      {/* Quote / Enquiry Modal */}
      <QuoteInquiryModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
};
