'use client';

import React from 'react';
import { Button } from '../ui/Button';

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
    <section className="py-20 sm:py-24 lg:py-28 bg-[var(--brand-purple)] text-white" aria-labelledby="about-cta-heading">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2
            id="about-cta-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.14] mb-5"
          >
            {headline}
          </h2>
          <p className="text-base sm:text-lg text-white/80 leading-relaxed font-normal mb-8 sm:mb-10">
            {body}
          </p>
          <div>
            <Button
              variant="primary"
              size="lg"
              onClick={onOpenQuote}
              icon={false}
              className="!bg-[var(--brand-lime)] !text-[#202024] hover:!bg-[#D4F518]"
            >
              {ctaLabel}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
