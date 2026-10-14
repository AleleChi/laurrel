'use client';

import React from 'react';
import Image from 'next/image';

interface WhyPoint {
  id?: string;
  title: string;
  description: string;
  icon?: string;
}

interface AboutWhySectionProps {
  eyebrow: string;
  headline: string;
  intro?: string;
  items: WhyPoint[];
  imageSrc?: string;
  altText?: string;
  cutoutImageSrc?: string;
  cutoutAltText?: string;
}

export const AboutWhySection: React.FC<AboutWhySectionProps> = ({
  eyebrow,
  headline,
  items,
  cutoutImageSrc = '/assets/about/mover-cutout.png',
  cutoutAltText = 'Laurrel Services professional moving specialist standing with packed carton',
}) => {
  return (
    <section className="w-full bg-[#C8E80B] text-[#202024] py-20 lg:py-28 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Centred Eyebrow & Massive H2 Headline */}
        <div className="text-center max-w-4xl mx-auto mb-16 lg:mb-20">
          <span className="text-xs sm:text-sm font-bold tracking-widest text-[#202024]/75 uppercase mb-3 block">
            {eyebrow}
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-[60px] xl:text-[68px] font-medium leading-[1.08] tracking-[-0.03em] text-[#202024]">
            {headline}
          </h2>
        </div>

        {/* 2-Part Composition: 2x2 Grid of 4 Black Circular Icon Groups + Cutout Subject */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: 2x2 Information Grid (~7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10 lg:gap-y-12">
            {items.map((item, index) => (
              <div key={item.title} className="flex flex-col items-start">
                {/* Black Circular Icon Tile with Lime Linework */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#18181B] flex items-center justify-center mb-4 sm:mb-5 flex-shrink-0 shadow-sm">
                  {index === 0 && (
                    /* 01: One Point of Contact (Connected central hub) */
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 stroke-[#C8E80B] stroke-[1.8] fill-none"
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v4" />
                      <path d="M12 18v4" />
                      <path d="m4.93 4.93 2.83 2.83" />
                      <path d="m16.24 16.24 2.83 2.83" />
                      <path d="M2 12h4" />
                      <path d="M18 12h4" />
                      <path d="m4.93 19.07 2.83-2.83" />
                      <path d="m16.24 7.76 2.83-2.83" />
                    </svg>
                  )}
                  {index === 1 && (
                    /* 02: Direct Ottawa Coordination (Pin & timetable map) */
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 stroke-[#C8E80B] stroke-[1.8] fill-none"
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  )}
                  {index === 2 && (
                    /* 03: Trained & Equipped Crews (Protective badge & tools) */
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 stroke-[#C8E80B] stroke-[1.8] fill-none"
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  )}
                  {index === 3 && (
                    /* 04: Clear Upfront Pricing (Transparent receipt / document check) */
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 stroke-[#C8E80B] stroke-[1.8] fill-none"
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-[#202024] mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-[#202024]/85 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Right: Prominent Cutout Subject Image (~5 cols) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end items-end relative pt-6 lg:pt-0">
            <div className="relative w-full max-w-[420px] sm:max-w-[460px] lg:max-w-[500px] h-[480px] sm:h-[540px] lg:h-[620px]">
              <Image
                src={cutoutImageSrc}
                alt={cutoutAltText}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 500px"
                className="object-contain object-bottom drop-shadow-[0_20px_35px_rgba(32,32,36,0.18)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
