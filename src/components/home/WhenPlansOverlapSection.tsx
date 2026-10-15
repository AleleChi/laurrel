'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { siteConfig, OverlappingPlansConfig } from '@/content/site';

interface WhenPlansOverlapSectionProps {
  content?: OverlappingPlansConfig;
  onOpenQuote?: () => void;
}

export const WhenPlansOverlapSection: React.FC<WhenPlansOverlapSectionProps> = ({
  content = siteConfig.overlappingPlans,
  onOpenQuote,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const situations = content.situations;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? situations.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === situations.length - 1 ? 0 : prev + 1));
  };

  return (
    <section
      id="when-plans-overlap"
      aria-labelledby="when-plans-overlap-heading"
      className="w-full py-20 lg:py-28 px-6 sm:px-8 lg:px-12 xl:px-16 bg-[#F8F7F4] border-t border-[#202024]/8"
    >
      <div className="max-w-[1400px] xl:max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold tracking-widest uppercase text-[#390044] mb-3 block">
              {content.eyebrow}
            </span>
            <h2
              id="when-plans-overlap-heading"
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-semibold text-[#18181B] tracking-[-0.03em] leading-[1.12] mb-6"
            >
              {content.headline}
            </h2>
            <div className="space-y-4 text-base sm:text-lg text-[#202024]/85 leading-relaxed font-normal">
              {content.intro.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Slider Arrow Controls (Desktop / Tablet) */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0 mb-2">
            <button
              onClick={handlePrev}
              aria-label="Previous situation"
              className="w-12 h-12 rounded-full border border-[#202024]/15 bg-white hover:bg-[#F2F1ED] text-[#18181B] flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#18181B]"
            >
              <ChevronLeft className="w-5 h-5 text-[#18181B]" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next situation"
              className="w-12 h-12 rounded-full border border-[#202024]/15 bg-white hover:bg-[#F2F1ED] text-[#18181B] flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#18181B]"
            >
              <ChevronRight className="w-5 h-5 text-[#18181B]" />
            </button>
          </div>
        </div>

        {/* Featured Situations Photographic Slider / Grid */}
        <div
          ref={sliderRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 sm:mb-16"
        >
          {situations.map((item, idx) => {
            const isFeatured = idx === activeIndex;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`group flex flex-col rounded-[32px] sm:rounded-[36px] overflow-hidden bg-white border transition-all duration-300 shadow-xs hover:shadow-md ${
                  isFeatured
                    ? 'border-[#390044]/30 ring-1 ring-[#390044]/15'
                    : 'border-[#202024]/10 hover:border-[#202024]/20'
                }`}
              >
                {/* Horizontal / Card Photograph */}
                <div className="relative w-full aspect-[16/11] overflow-hidden bg-[#202024]/5">
                  <Image
                    src={item.imageSrc}
                    alt={item.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 450px"
                    className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-104"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F8F7F4]/90 backdrop-blur-md text-[#18181B] shadow-2xs">
                      Situation 0{idx + 1}
                    </span>
                  </div>
                </div>

                {/* Situation Content */}
                <div className="p-7 sm:p-8 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-[#18181B] tracking-tight mb-3">
                      {item.title}
                    </h3>
                    <p className="text-sm sm:text-[15px] text-[#202024]/80 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#202024]/8 flex items-center justify-between text-xs font-semibold text-[#390044]">
                    <span>Ottawa coordinated service</span>
                    <ArrowRight className="w-4 h-4 text-[#390044] transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Dot Indicators */}
        <div className="flex sm:hidden items-center justify-center gap-2 mb-10">
          {situations.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${
                idx === activeIndex ? 'w-7 bg-[#18181B]' : 'w-2 bg-[#202024]/20'
              }`}
            />
          ))}
        </div>

        {/* Section Action CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <button
            onClick={onOpenQuote}
            className="inline-flex items-center gap-3 bg-[#18181B] hover:bg-[#390044] text-white px-8 py-4 rounded-full font-medium text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B] shadow-sm cursor-pointer"
          >
            <span>{content.cta.label}</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>

      </div>
    </section>
  );
};
