'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AboutHeroBannerProps {
  title: string;
  breadcrumb: { label: string; href: string }[];
  imageSrc: string;
  altText: string;
}

export const AboutHeroBanner: React.FC<AboutHeroBannerProps> = ({
  title,
  breadcrumb,
  imageSrc,
  altText,
}) => {
  return (
    <div className="relative w-full h-[360px] sm:h-[400px] lg:h-[440px] flex items-center justify-center overflow-hidden bg-[#202024]">
      {/* Background Image with optimized focal crop */}
      <Image
        src={imageSrc}
        alt={altText}
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_35%]"
      />

      {/* Minimal dark overlay strictly calibrated for accessible contrast */}
      <div
        className="absolute inset-0 bg-[#202024]/55"
        aria-hidden="true"
      />

      {/* Centered Editorial Title and Semantic Breadcrumbs */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.75rem] font-extrabold text-white tracking-tight leading-[1.12]">
          {title}
        </h1>

        {/* Semantic Breadcrumb Navigation — strictly no pills, cards, badges, or icons */}
        <nav
          aria-label="Breadcrumb"
          className="mt-4 sm:mt-5 flex items-center justify-center gap-2.5 text-sm sm:text-base font-medium text-white/90"
        >
          {breadcrumb.map((item, idx) => {
            const isLast = idx === breadcrumb.length - 1;
            return (
              <React.Fragment key={item.label}>
                {idx > 0 && (
                  <span className="text-white/40 select-none" aria-hidden="true">
                    /
                  </span>
                )}
                {isLast ? (
                  <span className="text-[var(--brand-lime)]" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-white/85 hover:text-white underline-offset-4 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                  >
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
