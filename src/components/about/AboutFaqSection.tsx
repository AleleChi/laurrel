'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FaqItem } from '@/content/site';

interface AboutFaqSectionProps {
  eyebrow: string;
  headline: string;
  imageSrc: string;
  altText: string;
  items: FaqItem[];
}

export const AboutFaqSection: React.FC<AboutFaqSectionProps> = ({
  eyebrow,
  headline,
  imageSrc,
  altText,
  items,
}) => {
  // Allow multiple or single open accordion; default first item open
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  const toggleIndex = (idx: number) => {
    if (openIndexes.includes(idx)) {
      setOpenIndexes(openIndexes.filter((i) => i !== idx));
    } else {
      setOpenIndexes([...openIndexes, idx]);
    }
  };

  return (
    <section className="py-20 sm:py-24 lg:py-32 bg-[#FFFFFF] border-t border-black/[0.06]" aria-labelledby="faq-heading">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Block */}
        <div className="max-w-3xl mb-14 sm:mb-18 lg:mb-20">
          <p className="text-xs sm:text-[13px] font-bold tracking-[0.14em] uppercase text-[#390044] mb-3.5">
            {eyebrow}
          </p>
          <h2
            id="faq-heading"
            className="text-3xl sm:text-4xl lg:text-[2.85rem] xl:text-[3.25rem] font-extrabold tracking-tight text-[#390044] leading-[1.14]"
          >
            {headline}
          </h2>
        </div>

        {/* 2-Column Composition: Supporting Visual + Accessible Accordion */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 xl:gap-16 items-start">
          
          {/* Supporting Photograph */}
          <div className="lg:col-span-5 w-full">
            <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] rounded-3xl overflow-hidden border border-black/[0.08] shadow-card-soft bg-neutral-100 sticky top-28">
              <Image
                src={imageSrc}
                alt={altText}
                fill
                loading="eager"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 42vw, 520px"
                className="object-cover object-[center_35%]"
              />
            </div>
          </div>

          {/* Accordion Questions Area */}
          <div className="lg:col-span-7 flex flex-col divide-y divide-black/10">
            {items.map((item, idx) => {
              const isOpen = openIndexes.includes(idx);
              const contentId = `faq-content-${idx}`;
              const buttonId = `faq-button-${idx}`;

              return (
                <div key={item.question} className="py-5 sm:py-6 first:pt-0 last:pb-0">
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => toggleIndex(idx)}
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    className="w-full flex items-start justify-between text-left gap-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#390044] rounded-lg p-1 -m-1"
                  >
                    <span className="text-lg sm:text-xl font-bold text-[#202024] group-hover:text-[#390044] transition-colors leading-snug">
                      {item.question}
                    </span>
                    {/* Minimal plus/minus text glyph indicator */}
                    <span
                      className="flex-shrink-0 text-xl font-light text-[#202024]/70 group-hover:text-[#390044] select-none w-6 h-6 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={contentId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="mt-3.5 pr-6 text-base text-[#575757] leading-relaxed font-normal"
                    >
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
