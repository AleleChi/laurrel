'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { siteConfig } from '@/content/site';
import { getHomeHeroData, isCmsConfigured } from '@/sanity/client';

interface HeroProps {
  onOpenQuote: (service?: 'cleaning' | 'moving' | 'storage') => void;
  initialData?: typeof siteConfig.hero;
}

export const Hero: React.FC<HeroProps> = ({ onOpenQuote, initialData }) => {
  const [hero, setHero] = useState(initialData || siteConfig.hero);

  useEffect(() => {
    if (initialData) {
      setHero(initialData);
    } else if (isCmsConfigured) {
      getHomeHeroData()
        .then((res) => {
          if (res?.data) {
            setHero(res.data);
          }
        })
        .catch(() => {});
    }
  }, [initialData]);

  const heroImageSrc = hero.media?.imageSrc || '/assets/hero/cleaning-hero.webp';
  const heroImageAlt =
    hero.media?.altText ||
    'Professional cleaner wearing yellow gloves detailing a bright kitchen counter in an Ottawa home';

  return (
    <section
      className="relative pt-3 pb-8 sm:pt-6 sm:pb-12 lg:pt-8 lg:pb-14 overflow-hidden"
      aria-label="Hero Introduction"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Typographic & Action Content (~48% of layout) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2.5 mb-4 sm:mb-5">
              <span className="w-6 sm:w-8 h-[3px] bg-[#FE6000] rounded-full inline-block" />
              <span className="text-xs sm:text-[13px] font-bold tracking-[0.16em] uppercase text-[#202024]/85">
                {hero.eyebrow}
              </span>
            </div>

            {/* H1 Headline */}
            <h1 className="text-[2.5rem] sm:text-[3.25rem] lg:text-[3.8rem] xl:text-[4.3rem] font-extrabold tracking-tight leading-[1.08] text-[#49056B]">
              <span>{hero.headline.line1} </span>
              <span className="text-[#FE6000]">{hero.headline.line2}</span>
              {hero.headline.line3 ? (
                <span className="block">{hero.headline.line3}</span>
              ) : null}
            </h1>

            {/* Explanatory Body Copy */}
            <p className="mt-5 sm:mt-6 text-base sm:text-lg text-[#575757] leading-relaxed max-w-xl font-normal">
              {hero.body}
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onOpenQuote()}
                className="w-full sm:w-auto"
              >
                {hero.primaryCta.label}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                href="#services"
                className="w-full sm:w-auto"
              >
                {hero.secondaryCta.label}
              </Button>
            </div>

            {/* Supporting Compact Planning Card */}
            <div className="mt-8 sm:mt-10 bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.08] shadow-card-soft max-w-lg">
              <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#FE6000]/15 border border-[#FE6000]/30 flex items-center justify-center text-[#FE6000] mt-0.5 sm:mt-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="text-sm font-bold text-[#202024] leading-snug">
                    {hero.supportCard.heading}
                  </h3>
                  <p className="text-xs text-[#575757] mt-0.5 leading-relaxed">
                    {hero.supportCard.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenQuote()}
                  className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[#49056B] hover:text-[#FE6000] transition-colors py-1 pl-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49056B] rounded whitespace-nowrap self-center cursor-pointer"
                >
                  <span>{hero.supportCard.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: High-Impact Authentic Service Photography (~52% of layout) */}
          <div className="lg:col-span-6 xl:col-span-6 w-full">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] xl:aspect-[16/11] rounded-2xl overflow-hidden border border-black/[0.08] shadow-card-soft bg-[#202024]">
              <Image
                src={heroImageSrc}
                alt={heroImageAlt}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 680px"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
