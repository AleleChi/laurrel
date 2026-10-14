'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface EmphasisPoint {
  id: string;
  text: string;
}

interface AboutCompanySectionProps {
  eyebrow: string;
  headline: string;
  paragraph1: string;
  paragraph2: string;
  emphasisPoints?: EmphasisPoint[];
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
  emphasisPoints = [
    {
      id: 'service',
      text: 'Book the service your property or move requires.',
    },
    {
      id: 'enquiry',
      text: 'Discuss multiple service needs in the same enquiry.',
    },
  ],
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
            <h2 className="text-3xl sm:text-4xl lg:text-[48px] xl:text-[52px] font-medium leading-[1.12] tracking-[-0.03em] text-[#202024] mb-6">
              {headline}
            </h2>

            {/* Editorial Paragraphs */}
            <div className="space-y-4 text-base sm:text-lg leading-relaxed text-[#202024]/80 mb-6 max-w-2xl">
              <p>{paragraph1}</p>
              <p>{paragraph2}</p>
            </div>

            {/* Two Restrained Emphasis Statements with Original Vector Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 mb-8 border-t border-b border-[#202024]/10 max-w-2xl">
              {emphasisPoints.map((item, index) => (
                <div key={item.id || index} className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#390044]/10 text-[#390044] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index === 0 ? (
                      /* Icon 1: Calendar / Scheduled booking */
                      <svg
                        className="w-5 h-5 stroke-current stroke-[1.8] fill-none"
                        viewBox="0 0 24 24"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="3" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <path d="m9 16 2 2 4-4" />
                      </svg>
                    ) : (
                      /* Icon 2: Connected services / Multi-service layers */
                      <svg
                        className="w-5 h-5 stroke-current stroke-[1.8] fill-none"
                        viewBox="0 0 24 24"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                        <path d="m2 17 10 5 10-5" />
                        <path d="m2 12 10 5 10-5" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm sm:text-[15px] font-medium leading-snug text-[#202024]">
                    {item.text}
                  </p>
                </div>
              ))}
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
