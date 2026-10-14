'use client';

import React from 'react';

interface AboutStartProps {
  label: string;
  headline: string;
  paragraph: string;
  closingLine: string;
}

export const AboutStart: React.FC<AboutStartProps> = ({
  label,
  headline,
  paragraph,
  closingLine,
}) => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#F8F7F4]" aria-labelledby="about-start-heading">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs sm:text-[13px] font-bold tracking-[0.14em] uppercase text-[#390044] mb-4">
            {label}
          </p>
          <h2
            id="about-start-heading"
            className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-tight text-[#390044] leading-[1.14] mb-6"
          >
            {headline}
          </h2>
          <div className="space-y-4 text-base sm:text-lg text-[#575757] leading-relaxed font-normal">
            <p>{paragraph}</p>
            <p className="font-semibold text-[#202024] pt-2">{closingLine}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
