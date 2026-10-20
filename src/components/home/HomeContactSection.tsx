'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { siteConfig, HomeContactConfig } from '@/content/site';

interface HomeContactSectionProps {
  content?: HomeContactConfig;
}

export const HomeContactSection: React.FC<HomeContactSectionProps> = ({
  content = siteConfig.homeContact,
}) => {
  return (
    <section
      id="contact"
      aria-labelledby="home-contact-heading"
      className="w-full py-20 lg:py-28 px-6 sm:px-8 lg:px-12 xl:px-16 bg-white border-t border-[#202024]/8"
    >
      <div className="max-w-[1400px] xl:max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Left Column: Eyebrow + Strong Editorial Heading (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <span className="text-xs font-bold tracking-widest uppercase text-[#49056B] mb-3">
              {content.eyebrow}
            </span>
            <h2
              id="home-contact-heading"
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-semibold text-[#18181B] tracking-[-0.03em] leading-[1.12]"
            >
              {content.headline}
            </h2>
          </div>

          {/* Right Column: Short Paragraph + Single Clear Contact CTA (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-start lg:items-start lg:pl-6">
            <p className="text-base sm:text-lg text-[#202024]/80 leading-relaxed font-normal mb-8 max-w-lg">
              {content.paragraph}
            </p>

            <Link
              href={content.primaryCta.href}
              className="inline-flex items-center justify-center gap-3 bg-[#18181B] hover:bg-[#49056B] text-white px-8 py-4 rounded-full font-medium text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B] shadow-sm cursor-pointer"
            >
              <span>{content.primaryCta.label}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};
