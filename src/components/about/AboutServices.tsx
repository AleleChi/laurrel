'use client';

import React from 'react';
import Image from 'next/image';
import { AboutServiceItem } from '@/content/site';

interface AboutServicesProps {
  label: string;
  headline: string;
  intro: string;
  services: AboutServiceItem[];
}

export const AboutServices: React.FC<AboutServicesProps> = ({
  label,
  headline,
  intro,
  services,
}) => {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-[#FFFFFF] border-y border-black/[0.06]" aria-labelledby="about-work-heading">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="max-w-3xl mb-14 sm:mb-18 lg:mb-20">
          <p className="text-xs sm:text-[13px] font-bold tracking-[0.14em] uppercase text-[#390044] mb-4">
            {label}
          </p>
          <h2
            id="about-work-heading"
            className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-tight text-[#390044] leading-[1.14] mb-6"
          >
            {headline}
          </h2>
          <p className="text-base sm:text-lg text-[#575757] leading-relaxed font-normal">
            {intro}
          </p>
        </div>

        {/* Editorial Service Sections — Alternating visual rhythm, strictly without generic card boxes or icons */}
        <div className="space-y-16 sm:space-y-20 lg:space-y-24">
          {services.map((service, idx) => {
            const isReversed = idx % 2 === 1;
            return (
              <div
                key={service.title}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-16 items-center ${
                  isReversed ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Text Content */}
                <div
                  className={`lg:col-span-6 ${
                    isReversed ? 'lg:order-2' : 'lg:order-1'
                  }`}
                >
                  <span className="text-xs sm:text-[13px] font-bold tracking-[0.16em] uppercase text-[#390044]/70 block mb-2">
                    0{idx + 1}
                  </span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#390044] tracking-tight leading-snug mb-4">
                    {service.title}
                  </h3>
                  <p className="text-base sm:text-[17px] text-[#575757] leading-relaxed font-normal">
                    {service.description}
                  </p>
                </div>

                {/* Editorial Photo */}
                {service.imageSrc && (
                  <div
                    className={`lg:col-span-6 w-full ${
                      isReversed ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] rounded-3xl overflow-hidden border border-black/[0.08] shadow-card-soft bg-neutral-100">
                      <Image
                        src={service.imageSrc}
                        alt={service.altText || service.title}
                        fill
                        loading="eager"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                        className="object-cover object-[center_40%]"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
