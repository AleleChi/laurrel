'use client';

import React from 'react';
import Image from 'next/image';

interface WhyPoint {
  title: string;
  description: string;
}

interface AboutWhySectionProps {
  eyebrow: string;
  headline: string;
  intro: string;
  items: WhyPoint[];
  imageSrc: string;
  altText: string;
}

export const AboutWhySection: React.FC<AboutWhySectionProps> = ({
  eyebrow,
  headline,
  intro,
  items,
  imageSrc,
  altText,
}) => {
  return (
    <section className="w-full bg-[#F8F7F4] py-20 lg:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Portion: Editorial Hierarchy & 4 Information Blocks (~58% width) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Section Eyebrow Label */}
            <span className="text-xs font-semibold tracking-wider text-[#390044] uppercase mb-4 block">
              {eyebrow}
            </span>

            {/* Substantial H2 */}
            <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-medium leading-[1.15] tracking-[-0.03em] text-[#202024] mb-5">
              {headline}
            </h2>

            {/* Short Introduction Paragraph */}
            <p className="text-base sm:text-lg text-[#202024]/75 leading-relaxed mb-10 max-w-2xl">
              {intro}
            </p>

            {/* 4 Carefully Spaced Information Blocks (Pure Typography, Zero Cards, Zero Icons) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8 pt-2">
              {items.map((item) => (
                <div key={item.title} className="flex flex-col">
                  <h3 className="text-lg sm:text-xl font-semibold text-[#202024] mb-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed text-[#202024]/80">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Portion: Dominant Service Photograph (~42% width) */}
          <div className="lg:col-span-5 w-full h-full">
            <div className="relative w-full aspect-[4/5] sm:aspect-[450/540] lg:h-[580px] rounded-[40px] lg:rounded-[50px] overflow-hidden shadow-sm bg-[#202024]/5">
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
        </div>
      </div>
    </section>
  );
};
