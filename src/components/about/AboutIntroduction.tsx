'use client';

import React from 'react';
import Image from 'next/image';

interface AboutIntroductionProps {
  label: string;
  headline: string;
  paragraphs: string[];
  imageSrc: string;
  altText: string;
}

export const AboutIntroduction: React.FC<AboutIntroductionProps> = ({
  label,
  headline,
  paragraphs,
  imageSrc,
  altText,
}) => {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-[#F8F7F4]" aria-labelledby="about-intro-heading">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Label & Headline */}
        <div className="max-w-4xl mb-12 sm:mb-16">
          <p className="text-xs sm:text-[13px] font-bold tracking-[0.14em] uppercase text-[#390044] mb-4">
            {label}
          </p>
          <h2
            id="about-intro-heading"
            className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-tight text-[#390044] leading-[1.14]"
          >
            {headline}
          </h2>
        </div>

        {/* Editorial Split: Paragraphs & Supporting Architectural Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-start">
          {/* Paragraphs */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-base sm:text-lg text-[#575757] leading-relaxed font-normal">
            {paragraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>

          {/* Supporting Photograph */}
          <div className="lg:col-span-5 w-full">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/5] rounded-3xl overflow-hidden border border-black/[0.08] shadow-card-soft bg-neutral-100">
              <Image
                src={imageSrc}
                alt={altText}
                fill
                loading="eager"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 42vw, 500px"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
