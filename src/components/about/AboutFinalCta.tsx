'use client';

import React from 'react';

interface AboutFinalCtaProps {
  headline: string;
  body: string;
  ctaLabel: string;
  onOpenQuote: () => void;
}

export const AboutFinalCta: React.FC<AboutFinalCtaProps> = ({
  headline,
  body,
  ctaLabel,
  onOpenQuote,
}) => {
  return (
    <section className="w-full bg-[#F8F7F4] py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="bg-[#390044] rounded-[32px] lg:rounded-[40px] px-8 py-14 sm:px-16 sm:py-20 text-center flex flex-col items-center justify-center shadow-sm">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-medium text-white tracking-[-0.02em] leading-tight mb-4 max-w-2xl">
            {headline}
          </h2>
          <p className="text-white/80 text-base sm:text-lg max-w-xl leading-relaxed mb-8">
            {body}
          </p>
          <button
            type="button"
            onClick={onOpenQuote}
            className="inline-flex items-center justify-center px-8 py-4 bg-[#C8E80B] text-[#202024] font-semibold text-base rounded-full transition-all duration-200 hover:bg-[#b5d309] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </section>
  );
};
