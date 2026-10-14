'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface FaqItem {
  question: string;
  answer: string;
}

interface AboutFaqSectionProps {
  eyebrow: string;
  headline: string;
  intro: string;
  items: FaqItem[];
  imageSrc: string;
  altText: string;
}

export const AboutFaqSection: React.FC<AboutFaqSectionProps> = ({
  eyebrow,
  headline,
  intro,
  items,
  imageSrc,
  altText,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="w-full bg-[#F8F7F4] border-t border-[#202024]/10 py-20 lg:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Dominant Photograph (Left Column, ~42% width) */}
          <div className="lg:col-span-5 w-full">
            <div className="relative w-full aspect-[4/5] sm:aspect-[450/540] lg:h-[620px] rounded-[40px] lg:rounded-[50px] overflow-hidden shadow-sm bg-[#202024]/5">
              <Image
                src={imageSrc}
                alt={altText}
                fill
                loading="eager"
                sizes="(max-width: 1024px) 100vw, 500px"
                className="object-cover object-center"
              />
            </div>
          </div>

          {/* FAQ Editorial Header + Interactive Accordion (Right Column, ~58% width) */}
          <div className="lg:col-span-7 flex flex-col justify-start">
            {/* Section Eyebrow Label */}
            <span className="text-xs font-semibold tracking-wider text-[#390044] uppercase mb-4 block">
              {eyebrow}
            </span>

            {/* Editorial Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-medium leading-[1.15] tracking-[-0.03em] text-[#202024] mb-4">
              {headline}
            </h2>

            {/* Brief Supporting Introduction */}
            <p className="text-base sm:text-lg text-[#202024]/75 leading-relaxed mb-8 max-w-2xl">
              {intro}
            </p>

            {/* Accessible Accordion (Minimal Dividers, Clean Minimal Glyph, No Cards) */}
            <div className="divide-y divide-[#202024]/15 border-t border-b border-[#202024]/15">
              {items.map((item, idx) => {
                const isOpen = openIndex === idx;
                const buttonId = `faq-btn-${idx}`;
                const panelId = `faq-panel-${idx}`;

                return (
                  <div key={item.question} className="py-5 sm:py-6">
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggleItem(idx)}
                      className="w-full flex items-center justify-between text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#390044] rounded"
                    >
                      <span className="text-lg sm:text-xl font-medium text-[#202024] group-hover:text-[#390044] transition-colors duration-200 pr-6">
                        {item.question}
                      </span>
                      <span
                        className="text-2xl font-light text-[#202024]/60 group-hover:text-[#390044] transition-transform duration-200 shrink-0 w-6 text-center select-none"
                        aria-hidden="true"
                      >
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>

                    {isOpen && (
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className="pt-3 pb-1 text-base sm:text-lg text-[#202024]/80 leading-relaxed max-w-2xl"
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
      </div>
    </section>
  );
};
