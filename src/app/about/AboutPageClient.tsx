'use client';

import React, { useState } from 'react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { AboutHeroBanner } from '@/components/about/AboutHeroBanner';
import { AboutCompanySection } from '@/components/about/AboutCompanySection';
import { AboutWhatWeDoSection } from '@/components/about/AboutWhatWeDoSection';
import { AboutWhySection } from '@/components/about/AboutWhySection';
import { AboutMarqueeSection } from '@/components/about/AboutMarqueeSection';
import { AboutFaqSection } from '@/components/about/AboutFaqSection';
import { QuoteInquiryModal } from '@/components/ui/QuoteInquiryModal';
import { AboutPageConfig } from '@/content/site';

interface AboutPageClientProps {
  content: AboutPageConfig;
}

export const AboutPageClient: React.FC<AboutPageClientProps> = ({ content }) => {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4]">
      {/* Persistent Global Floating Header */}
      <SiteHeader onOpenQuote={() => setIsQuoteModalOpen(true)} />

      {/* Main Experience: 6 Cohesive Sections Following Exact Solshine Architecture */}
      <main className="flex-1">
        {/* Section 01: Full-Width Photographic Banner with Breadcrumbs */}
        <AboutHeroBanner
          title={content.banner.title}
          breadcrumb={content.banner.breadcrumb}
          imageSrc={content.banner.imageSrc}
          altText={content.banner.altText}
        />

        {/* Section 02: About Our Company (Asymmetric Photo + Editorial Copy + Vector Icon Emphasis Points + Lime CTA) */}
        <AboutCompanySection
          eyebrow={content.aboutCompany.eyebrow}
          headline={content.aboutCompany.headline}
          paragraph1={content.aboutCompany.paragraph1}
          paragraph2={content.aboutCompany.paragraph2}
          emphasisPoints={content.aboutCompany.emphasisPoints}
          cta={content.aboutCompany.cta}
          imageSrc={content.aboutCompany.imageSrc}
          altText={content.aboutCompany.altText}
        />

        {/* Section 03: What We Do (Solshine 3-Stat Rhythm: 2-Col Header + 3 Equal Typographic Service Columns) */}
        <AboutWhatWeDoSection
          eyebrow={content.whatWeDo.eyebrow}
          headline={content.whatWeDo.headline}
          intro={content.whatWeDo.intro}
          statNumber={content.whatWeDo.statNumber}
          statLabel={content.whatWeDo.statLabel}
          services={content.whatWeDo.services}
        />

        {/* Section 04: Why Laurrel Services (Edge-to-Edge Lime #C8E80B + 2x2 Black Circular Tiles with Lime Linework + Standing Cutout Subject) */}
        <AboutWhySection
          eyebrow={content.whyLaurrel.eyebrow}
          headline={content.whyLaurrel.headline}
          intro={content.whyLaurrel.intro}
          items={content.whyLaurrel.items}
          imageSrc={content.whyLaurrel.imageSrc}
          altText={content.whyLaurrel.altText}
          cutoutImageSrc={content.whyLaurrel.cutoutImageSrc}
          cutoutAltText={content.whyLaurrel.cutoutAltText}
        />

        {/* Section 05: Dark Typography Marquee (Full-Width Black #0B0B0E Outlined Looping Typography) */}
        <AboutMarqueeSection
          items={content.marquee?.items}
        />

        {/* Section 06: Frequently Asked Questions (46/54% Asymmetric Photo + Accessible Accordion) */}
        <AboutFaqSection
          eyebrow={content.faq.eyebrow}
          headline={content.faq.headline}
          intro={content.faq.intro}
          items={content.faq.items}
          imageSrc={content.faq.imageSrc}
          altText={content.faq.altText}
        />
      </main>

      {/* Section 07: Global Full Dark Footer (#0B0B0E with Lime Contact Tiles + 4 Columns) */}
      <SiteFooter onOpenQuote={() => setIsQuoteModalOpen(true)} />

      {/* Working Quote Inquiry Modal */}
      <QuoteInquiryModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
};
