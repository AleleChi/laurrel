'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '../ui/Button';

interface AboutStorySectionProps {
  eyebrow: string;
  headline: string;
  bodyParagraphs: string[];
  ctaLabel: string;
  imageSrc: string;
  altText: string;
  onOpenQuote: () => void;
}

export const AboutStorySection: React.FC<AboutStorySectionProps> = ({
  eyebrow,
  headline,
  bodyParagraphs,
  ctaLabel,
  imageSrc,
  altText,
  onOpenQuote,
}) => {
  return (
    <section className="py-20 sm:py-24 lg:py-32 bg-[var(--warm-white)] border-t border-black/[0.06]" aria-labelledby="story-heading">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 xl:gap-16 items-center">
          
          {/* LEFT: Large Landscape Photograph */}
          <div className="lg:col-span-6 w-full order-2 lg:order-1">
            <div className="relative w-full aspect-[16/11] sm:aspect-[16/10] rounded-3xl overflow-hidden border border-black/[0.08] shadow-card-soft bg-neutral-100">
              <Image
                src={imageSrc}
                alt={altText}
                fill
                loading="eager"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 620px"
                className="object-cover object-[center_35%]"
              />
            </div>
          </div>

          {/* RIGHT: Concise Narrative & Working Enquiry CTA */}
          <div className="lg:col-span-6 flex flex-col items-start order-1 lg:order-2">
            <p className="text-xs sm:text-[13px] font-bold tracking-[0.14em] uppercase text-[#390044] mb-3.5">
              {eyebrow}
            </p>
            <h2
              id="story-heading"
              className="text-3xl sm:text-4xl lg:text-[2.85rem] xl:text-[3.15rem] font-extrabold tracking-tight text-[#390044] leading-[1.14] mb-6"
            >
              {headline}
            </h2>

            <div className="space-y-4 text-base sm:text-[17px] text-[#575757] leading-relaxed font-normal mb-8">
              {bodyParagraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <div>
              <Button
                variant="primary"
                size="lg"
                onClick={onOpenQuote}
                icon={false}
              >
                {ctaLabel}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
