'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AboutCompanySectionProps {
  eyebrow: string;
  headline: string;
  paragraph1: string;
  paragraph2: string;
  cta: {
    label: string;
    href: string;
  };
  imageSrc: string;
  altText: string;
}

export const AboutCompanySection: React.FC<AboutCompanySectionProps> = ({
  eyebrow,
  headline,
  paragraph1,
  paragraph2,
  cta,
  imageSrc,
  altText,
}) => {
  return (
    <section className="w-full bg-[#F8F7F4] py-20 lg:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Dominant Service Photograph (Left, ~42% width) */}
          <div className="lg:col-span-5 w-full">
            <div className="relative w-full aspect-[4/5] sm:aspect-[450/490] max-w-[480px] mx-auto lg:mx-0 rounded-[40px] lg:rounded-[50px] overflow-hidden shadow-sm bg-[#202024]/5">
              <Image
                src={imageSrc}
                alt={altText}
                fill
                loading="eager"
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover object-center"
              />
            </div>
          </div>

          {/* Editorial Introduction Content (Right, ~58% width) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Section Eyebrow Label (No badges, plain uppercase) */}
            <span className="text-xs font-semibold tracking-wider text-[#390044] uppercase mb-4 block">
              {eyebrow}
            </span>

            {/* Major H2 Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-medium leading-[1.15] tracking-[-0.03em] text-[#202024] mb-6">
              {headline}
            </h2>

            {/* Editorial Paragraphs */}
            <div className="space-y-4 text-base sm:text-lg leading-relaxed text-[#202024]/80 mb-8 max-w-2xl">
              <p>{paragraph1}</p>
              <p>{paragraph2}</p>
            </div>

            {/* Call to Action Button */}
            <div>
              <Link
                href={cta.href}
                className="inline-flex items-center justify-center px-7 py-3.5 bg-[#C8E80B] text-[#202024] font-semibold text-sm sm:text-base rounded-full transition-all duration-200 hover:bg-[#b5d309] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#390044]"
              >
                {cta.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
