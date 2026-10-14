'use client';

import React from 'react';
import Image from 'next/image';
import { EditorialPoint } from '@/content/site';

interface AboutWhySectionProps {
  eyebrow: string;
  headline: string;
  intro: string;
  points: EditorialPoint[];
  imageSrc: string;
  altText: string;
}

export const AboutWhySection: React.FC<AboutWhySectionProps> = ({
  eyebrow,
  headline,
  intro,
  points,
  imageSrc,
  altText,
}) => {
  return (
    <section className="py-20 sm:py-24 lg:py-32 bg-[#FFFFFF] border-t border-black/[0.06]" aria-labelledby="why-laurrel-heading">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Block */}
        <div className="max-w-3xl mb-14 sm:mb-18 lg:mb-20">
          <p className="text-xs sm:text-[13px] font-bold tracking-[0.14em] uppercase text-[#390044] mb-3.5">
            {eyebrow}
          </p>
          <h2
            id="why-laurrel-heading"
            className="text-3xl sm:text-4xl lg:text-[2.85rem] xl:text-[3.25rem] font-extrabold tracking-tight text-[#390044] leading-[1.14] mb-5"
          >
            {headline}
          </h2>
          <p className="text-base sm:text-lg text-[#575757] leading-relaxed font-normal">
            {intro}
          </p>
        </div>

        {/* Asymmetrical Composition: Numbered Editorial Points + Supporting Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 xl:gap-16 items-center">
          
          {/* LEFT: 3 Numbered Editorial Points */}
          <div className="lg:col-span-7 space-y-8 sm:space-y-10 order-2 lg:order-1">
            {points.map((pt) => (
              <div key={pt.number} className="flex flex-col items-start">
                <span className="text-xs sm:text-[13px] font-bold tracking-[0.16em] uppercase text-[#390044]/75 mb-1.5">
                  {pt.number}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#202024] tracking-tight leading-snug mb-2">
                  {pt.title}
                </h3>
                <p className="text-base text-[#575757] leading-relaxed font-normal max-w-xl">
                  {pt.description}
                </p>
              </div>
            ))}
          </div>

          {/* RIGHT: Supporting Service Photograph */}
          <div className="lg:col-span-5 w-full order-1 lg:order-2">
            <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] rounded-3xl overflow-hidden border border-black/[0.08] shadow-card-soft bg-neutral-100">
              <Image
                src={imageSrc}
                alt={altText}
                fill
                loading="eager"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 42vw, 520px"
                className="object-cover object-center"
              />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
