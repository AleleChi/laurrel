'use client';

import React from 'react';

interface WhatWeDoService {
  title: string;
  description: string;
}

interface AboutWhatWeDoSectionProps {
  eyebrow: string;
  headline: string;
  intro: string;
  services: WhatWeDoService[];
}

export const AboutWhatWeDoSection: React.FC<AboutWhatWeDoSectionProps> = ({
  eyebrow,
  headline,
  intro,
  services,
}) => {
  return (
    <section className="py-20 sm:py-24 lg:py-32 bg-[var(--warm-white)] border-t border-black/[0.06]" aria-labelledby="what-we-do-heading">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Block */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <p className="text-xs sm:text-[13px] font-bold tracking-[0.14em] uppercase text-[#390044] mb-3.5">
            {eyebrow}
          </p>
          <h2
            id="what-we-do-heading"
            className="text-3xl sm:text-4xl lg:text-[2.85rem] xl:text-[3.25rem] font-extrabold tracking-tight text-[#390044] leading-[1.14] mb-5"
          >
            {headline}
          </h2>
          <p className="text-base sm:text-lg text-[#575757] leading-relaxed font-normal">
            {intro}
          </p>
        </div>

        {/* Three Open Typographic Service Columns — Strictly no boxed cards, no icons, no decorative lines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 xl:gap-16 items-start">
          {services.map((service, idx) => (
            <div key={service.title} className="flex flex-col">
              <span className="text-xs sm:text-[13px] font-bold tracking-[0.16em] uppercase text-[#390044]/65 block mb-2.5">
                0{idx + 1}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#390044] tracking-tight leading-snug mb-3.5">
                {service.title}
              </h3>
              <p className="text-base sm:text-[16px] text-[#575757] leading-relaxed font-normal">
                {service.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
