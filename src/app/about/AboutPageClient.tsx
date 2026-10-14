'use client';

import React, { useState } from 'react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { AboutHeroBanner } from '@/components/about/AboutHeroBanner';
import { AboutCompanySection } from '@/components/about/AboutCompanySection';
import { AboutWhatWeDoSection } from '@/components/about/AboutWhatWeDoSection';
import { AboutWhySection } from '@/components/about/AboutWhySection';
import { AboutStorySection } from '@/components/about/AboutStorySection';
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

      {/* Main Experience: 7 Editorial Sections */}
      <main className="flex-1">
        {/* Section 01: Full-width Photographic Banner with Breadcrumbs */}
        <AboutHeroBanner
          title={content.banner.title}
          breadcrumb={content.banner.breadcrumb}
          imageSrc={content.banner.imageSrc}
          altText={content.banner.altText}
        />

        {/* Section 02: About Our Company (Editorial Two-Column) */}
        <AboutCompanySection
          eyebrow={content.aboutCompany.eyebrow}
          headline={content.aboutCompany.headline}
          paragraph1={content.aboutCompany.paragraph1}
          paragraph2={content.aboutCompany.paragraph2}
          cta={content.aboutCompany.cta}
          imageSrc={content.aboutCompany.imageSrc}
          altText={content.aboutCompany.altText}
        />

        {/* Section 03: What We Do (Typographic 3-Column Experience) */}
        <AboutWhatWeDoSection
          eyebrow={content.whatWeDo.eyebrow}
          headline={content.whatWeDo.headline}
          intro={content.whatWeDo.intro}
          services={content.whatWeDo.services}
        />

        {/* Section 04: Why People Consider Laurrel (Why Choose Adaptation) */}
        <AboutWhySection
          eyebrow={content.whyLaurrel.eyebrow}
          headline={content.whyLaurrel.headline}
          intro={content.whyLaurrel.intro}
          points={content.whyLaurrel.points}
          imageSrc={content.whyLaurrel.imageSrc}
          altText={content.whyLaurrel.altText}
        />

        {/* Section 05: Photographic Story (When Plans Overlap - Replaces Team) */}
        <AboutStorySection
          eyebrow={content.photographicStory.eyebrow}
          headline={content.photographicStory.headline}
          bodyParagraphs={content.photographicStory.bodyParagraphs}
          ctaLabel={content.photographicStory.ctaLabel}
          imageSrc={content.photographicStory.imageSrc}
          altText={content.photographicStory.altText}
          onOpenQuote={() => setIsQuoteModalOpen(true)}
        />

        {/* Section 06: Frequently Asked Questions (Accordion + Supporting Image) */}
        <AboutFaqSection
          eyebrow={content.faq.eyebrow}
          headline={content.faq.headline}
          imageSrc={content.faq.imageSrc}
          altText={content.faq.altText}
          items={content.faq.items}
        />

        {/* Section 07: Final Closing Call to Action */}
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
