'use client';

import React from 'react';

interface AboutLocationProps {
  label: string;
  headline: string;
  body: string;
}

export const AboutLocation: React.FC<AboutLocationProps> = ({
  label,
  headline,
  body,
}) => {
  return (
    <section className="py-16 sm:py-20 bg-[#FFFFFF] border-t border-black/[0.06]" aria-labelledby="about-location-heading">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs sm:text-[13px] font-bold tracking-[0.14em] uppercase text-[#390044] mb-4">
            {label}
          </p>
          <h2
            id="about-location-heading"
            className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-tight text-[#390044] leading-[1.14] mb-6"
          >
            {headline}
          </h2>
          <p className="text-base sm:text-lg text-[#575757] leading-relaxed font-normal">
            {body}
          </p>
        </div>
      </div>
    </section>
  );
};
