'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION_EASE, MOTION_DURATIONS } from '@/utils/motion';

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
  const shouldReduceMotion = useReducedMotion();

  const titleVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : MOTION_DURATIONS.deliberate,
        delay: shouldReduceMotion ? 0 : 0.1,
        ease: MOTION_EASE,
      },
    },
  };

  const breadcrumbVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 12,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : MOTION_DURATIONS.medium,
        delay: shouldReduceMotion ? 0 : 0.28,
        ease: MOTION_EASE,
      },
    },
  };

  return (
    <div className="relative w-full min-h-[500px] lg:h-[550px] flex items-center justify-center overflow-hidden bg-[#202024]">
      {/* Full-bleed background photograph (loads eagerly without blocking text) */}
      <Image
        src={imageSrc}
        alt={altText}
        fill
        priority
        loading="eager"
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Clean photographic contrast overlay */}
      <div
        className="absolute inset-0 bg-[#202024]/50 backdrop-brightness-[0.88]"
        aria-hidden="true"
      />

      {/* Centred safe-area content below floating header */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8 pt-32 sm:pt-36 lg:pt-40 pb-16 flex flex-col items-center justify-center text-center">
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={titleVariants}
          className="text-4xl sm:text-5xl lg:text-[65px] font-medium text-white tracking-[-0.03em] leading-[1.08] max-w-4xl"
        >
          {title}
        </motion.h1>

        {/* Semantic breadcrumb directly beneath H1 */}
        <motion.nav
          initial="hidden"
          animate="visible"
          variants={breadcrumbVariants}
          aria-label="Breadcrumbs"
          className="mt-6 flex items-center justify-center gap-2.5 text-sm sm:text-base font-medium text-white/90"
        >
          {breadcrumb.map((item, index) => {
            const isLast = index === breadcrumb.length - 1;
            return (
              <React.Fragment key={item.label}>
                {index > 0 && (
                  <span className="text-white/50 select-none" aria-hidden="true">
                    /
                  </span>
                )}
                {isLast ? (
                  <span className="text-white" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-white transition-colors duration-200 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                  >
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </motion.nav>
      </div>
    </div>
  );
};
