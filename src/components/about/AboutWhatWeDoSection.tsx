'use client';

import React from 'react';
import Link from 'next/link';

interface ServiceItem {
  title: string;
  description: string;
  href: string;
}

interface AboutWhatWeDoSectionProps {
  eyebrow: string;
  headline: string;
  intro: string;
  statNumber: string;
  statLabel: string;
  services: ServiceItem[];
}

export const AboutWhatWeDoSection: React.FC<AboutWhatWeDoSectionProps> = ({
  eyebrow,
  headline,
  intro,
  statNumber,
  statLabel,
  services,
}) => {
  return (
    <section className="w-full bg-[#F8F7F4] border-t border-b border-[#202024]/10 py-20 lg:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Top Editorial Header Block */}
        <div className="max-w-4xl mb-16 lg:mb-20">
          <span className="text-xs font-semibold tracking-wider text-[#390044] uppercase mb-3 block">
            {eyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[50px] font-medium leading-[1.15] tracking-[-0.03em] text-[#202024] mb-5">
            {headline}
          </h2>
          <p className="text-base sm:text-lg text-[#202024]/75 leading-relaxed max-w-3xl">
            {intro}
          </p>
        </div>

        {/* Large-Scale Typographic Composition: Stat Anchor + 3 Service Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Typographic Number Anchor */}
          <div className="lg:col-span-4 flex flex-col justify-start pt-2">
            <span className="text-8xl sm:text-9xl font-bold tracking-tight text-[#390044] leading-none select-none">
              {statNumber}
            </span>
            <span className="text-xs sm:text-sm font-semibold tracking-widest text-[#202024]/70 uppercase mt-4 block">
              {statLabel}
            </span>
            <div className="w-16 h-1 bg-[#C8E80B] mt-5 rounded-full" aria-hidden="true" />
          </div>

          {/* Right Column: 3 Open Typographic Service Descriptions (No Bordered Cards) */}
          <div className="lg:col-span-8 flex flex-col divide-y divide-[#202024]/15">
            {services.map((service) => (
              <div key={service.title} className="py-8 first:pt-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
                  <h3 className="text-2xl sm:text-3xl font-semibold text-[#202024]">
                    {service.title}
                  </h3>
                  <Link
                    href={service.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#390044] hover:text-[#550066] transition-colors duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#390044] rounded"
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
                <p className="text-base sm:text-lg leading-relaxed text-[#202024]/80 max-w-2xl">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
