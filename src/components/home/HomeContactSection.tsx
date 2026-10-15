'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';
import { siteConfig, HomeContactConfig } from '@/content/site';

interface HomeContactSectionProps {
  content?: HomeContactConfig;
  onOpenQuote?: () => void;
}

export const HomeContactSection: React.FC<HomeContactSectionProps> = ({
  content = siteConfig.homeContact,
  onOpenQuote,
}) => {
  return (
    <section
      id="contact"
      aria-labelledby="home-contact-heading"
      className="w-full py-20 lg:py-28 px-6 sm:px-8 lg:px-12 xl:px-16 bg-white border-t border-[#202024]/8"
    >
      <div className="max-w-[1400px] xl:max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-center">
          
          {/* Main Editorial & Action Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <span className="text-xs font-bold tracking-widest uppercase text-[#390044] mb-3">
              {content.sectionLabel}
            </span>
            <h2
              id="home-contact-heading"
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-semibold text-[#18181B] tracking-[-0.03em] leading-[1.12] mb-6"
            >
              {content.headline}
            </h2>
            <p className="text-base sm:text-lg text-[#202024]/80 leading-relaxed font-normal max-w-xl mb-10">
              {content.body}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5 w-full sm:w-auto">
              <Link
                href={content.primaryButton.href}
                className="inline-flex items-center justify-center gap-3 bg-[#18181B] hover:bg-[#390044] text-white px-8 py-4 rounded-full font-medium text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B] shadow-sm cursor-pointer"
              >
                <span>{content.primaryButton.label}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              <button
                type="button"
                onClick={onOpenQuote}
                className="inline-flex items-center justify-center gap-2 bg-[#F8F7F4] hover:bg-[#EAE8E2] border border-[#202024]/12 text-[#18181B] px-8 py-4 rounded-full font-medium text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B] shadow-2xs cursor-pointer"
              >
                <span>{content.secondaryButton.label}</span>
              </button>
            </div>
          </div>

          {/* Service Dispatch Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#F2F1ED] rounded-[32px] sm:rounded-[36px] p-8 sm:p-10 border border-[#202024]/8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#C8E80B] text-[#18181B] flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6 text-[#18181B]" />
              </div>
              <span className="text-xs font-bold tracking-widest uppercase text-[#390044] mb-2 block">
                LOCAL OTTAWA SERVICE
              </span>
              <h3 className="text-xl sm:text-2xl font-semibold text-[#18181B] tracking-tight mb-3">
                Ottawa & National Capital Region
              </h3>
              <p className="text-sm sm:text-base text-[#202024]/75 leading-relaxed font-normal mb-6">
                Serving residential properties, commercial workplaces and families between addresses in Ottawa and surrounding communities.
              </p>
            </div>

            <div className="pt-6 border-t border-[#202024]/10 flex items-center gap-2 text-xs font-medium text-[#202024]/70">
              <Sparkles className="w-4 h-4 text-[#390044]" />
              <span>One responsive team for cleaning, moving and storage.</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
