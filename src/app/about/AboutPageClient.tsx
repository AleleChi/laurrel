'use client';

import React, { useState } from 'react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { AboutHeroBanner } from '@/components/about/AboutHeroBanner';
import { AboutCompanySection } from '@/components/about/AboutCompanySection';
import { AboutWhatWeDoSection } from '@/components/about/AboutWhatWeDoSection';
import { AboutWhySection } from '@/components/about/AboutWhySection';
import { AboutFaqSection } from '@/components/about/AboutFaqSection';
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

      {/* Main Experience: 6 Reconstructed Sections Following Solshine Architecture */}
      <main className="flex-1">
        {/* Section 01: Full-width Photographic Banner with Breadcrumbs */}
        <AboutHeroBanner
          title={content.banner.title}
          breadcrumb={content.banner.breadcrumb}
          imageSrc={content.banner.imageSrc}
          altText={content.banner.altText}
        />

        {/* Section 02: About Our Company (Asymmetric 450x490 Photograph + Editorial Copy) */}
        <AboutCompanySection
          eyebrow={content.aboutCompany.eyebrow}
          headline={content.aboutCompany.headline}
          paragraph1={content.aboutCompany.paragraph1}
          paragraph2={content.aboutCompany.paragraph2}
          cta={content.aboutCompany.cta}
          imageSrc={content.aboutCompany.imageSrc}
          altText={content.aboutCompany.altText}
        />

        {/* Section 03: What We Do (Oversized 03 Typography + 3 Open Service Descriptions) */}
        <AboutWhatWeDoSection
          eyebrow={content.whatWeDo.eyebrow}
          headline={content.whatWeDo.headline}
          intro={content.whatWeDo.intro}
          statNumber={content.whatWeDo.statNumber}
          statLabel={content.whatWeDo.statLabel}
          services={content.whatWeDo.services}
        />

        {/* Section 04: Why Laurrel (Editorial Hierarchy + Dominant Photograph) */}
        <AboutWhySection
          eyebrow={content.whyLaurrel.eyebrow}
          headline={content.whyLaurrel.headline}
          intro={content.whyLaurrel.intro}
          items={content.whyLaurrel.items}
          imageSrc={content.whyLaurrel.imageSrc}
          altText={content.whyLaurrel.altText}
        />

        {/* Section 05: Frequently Asked Questions (Photographic 2-Column + Accessible Accordion) */}
        <AboutFaqSection
          eyebrow={content.faq.eyebrow}
          headline={content.faq.headline}
          intro={content.faq.intro}
          items={content.faq.items}
          imageSrc={content.faq.imageSrc}
          altText={content.faq.altText}
        />

        {/* Section 06: Closing CTA */}
        <AboutFinalCta
          headline={content.finalCta.headline}
          body={content.finalCta.body}
          ctaLabel={content.finalCta.ctaLabel}
          onOpenQuote={() => setIsQuoteModalOpen(true)}
        />
      </main>

      {/* Global Laurrel Footer */}
      <SiteFooter onOpenQuote={() => setIsQuoteModalOpen(true)} />

      {/* Working Quote Inquiry Modal */}
      <QuoteInquiryModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
};
