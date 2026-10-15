'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { siteConfig, RequestQuoteSectionConfig } from '@/content/site';

interface RequestQuoteSectionProps {
  content?: RequestQuoteSectionConfig;
  onOpenQuote?: () => void;
}

export const RequestQuoteSection: React.FC<RequestQuoteSectionProps> = ({
  content = siteConfig.requestQuoteSection,
  onOpenQuote,
}) => {
  return (
    <section
      id="request-a-quote"
      aria-label="Request a Quote"
      className="bg-[#C8E80B] text-[#18181B] py-20 lg:py-28 px-6 sm:px-8 lg:px-12 xl:px-16 border-t border-[#202024]/10"
    >
      <div className="max-w-[1400px] xl:max-w-[1440px] 2xl:max-w-[1560px] mx-auto text-center flex flex-col items-center">
        
        {/* Eyebrow */}
        <span className="text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-[#18181B]/80 mb-4">
          {content.eyebrow}
        </span>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-semibold tracking-[-0.03em] leading-tight max-w-2xl mb-6 text-[#18181B]">
          {content.headline}
        </h2>

        {/* Body Copy */}
        <div className="space-y-3 text-base sm:text-lg text-[#18181B]/85 max-w-xl leading-relaxed mb-10 font-normal">
          {content.body.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8">
          <button
            onClick={onOpenQuote}
            className="inline-flex items-center gap-3 bg-[#18181B] hover:bg-[#390044] text-white px-8 py-4 rounded-full font-medium text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B] shadow-sm cursor-pointer w-full sm:w-auto justify-center"
          >
            <span>{content.primaryCta.label}</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>

          <Link
            href={content.secondaryLink.href}
            className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-[#18181B] hover:text-[#390044] underline-offset-4 hover:underline transition-colors py-2"
          >
            <span>{content.secondaryLink.label}</span>
            <ArrowRight className="w-4 h-4 text-[#18181B]" />
          </Link>
        </div>

      </div>
    </section>
  );
};
