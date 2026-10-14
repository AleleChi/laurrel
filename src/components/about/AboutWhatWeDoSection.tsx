'use client';

import React from 'react';
import Link from 'next/link';

interface ServiceItem {
  number?: string;
  title: string;
  description: string;
  href: string;
}

interface AboutWhatWeDoSectionProps {
  eyebrow: string;
  headline: string;
  intro: string;
  statNumber?: string;
  statLabel?: string;
  services: ServiceItem[];
}

export const AboutWhatWeDoSection: React.FC<AboutWhatWeDoSectionProps> = ({
  eyebrow,
  headline,
  intro,
  services,
}) => {
  return (
    <section className="w-full bg-[#F8F7F4] border-t border-[#202024]/10 py-20 lg:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Upper Portion: 2-Column Editorial Header (Solshine Rhythm) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end pb-12 lg:pb-16">
          <div className="lg:col-span-7">
            <span className="text-xs font-semibold tracking-wider text-[#390044] uppercase mb-3 block">
              {eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[48px] xl:text-[52px] font-medium leading-[1.12] tracking-[-0.03em] text-[#202024]">
              {headline}
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-base sm:text-lg text-[#202024]/75 leading-relaxed">
              {intro}
            </p>
          </div>
        </div>

        {/* Lower Portion: 3 Equal Typographic Columns with Subtle Dividers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 pt-4">
          {services.map((service, index) => {
            const num = service.number || `0${index + 1}`;
            return (
              <div
                key={service.title}
                className="group border-t border-[#202024]/15 pt-6 sm:pt-8 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-sm font-semibold tracking-widest text-[#390044]/60 uppercase">
                      {num}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full bg-[#C8E80B] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#202024] mb-3">
                    {service.title}
                  </h3>

                  <p className="text-base leading-relaxed text-[#202024]/80 mb-6">
                    {service.description}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href={service.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#390044] hover:text-[#550066] transition-colors duration-200 group-hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#390044] rounded"
                  >
                    <span>Explore {service.title}</span>
                    <span
                      className="transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
