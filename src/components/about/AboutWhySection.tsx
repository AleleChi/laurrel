'use client';

import React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION_EASE, MOTION_DURATIONS, VIEWPORT_CONFIG } from '@/utils/motion';

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
  cutoutImageSrc = '/assets/about/mover-cutout-trimmed.png',
  cutoutAltText = 'Laurrel Services professional moving specialist standing with packed carton',
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Animation variants
  const headerVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 16,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : MOTION_DURATIONS.standard,
        ease: MOTION_EASE,
      },
    },
  };

  const featureContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.12,
      },
    },
  };

  const featureItemVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 16,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : MOTION_DURATIONS.standard,
        ease: MOTION_EASE,
      },
    },
  };

  const cutoutVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 16,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : MOTION_DURATIONS.deliberate,
        delay: shouldReduceMotion ? 0 : 0.15,
        ease: MOTION_EASE,
      },
    },
  };

  return (
    <section
      aria-label="Why Laurrel Services"
      className="w-full bg-[#49056B] text-white pt-16 sm:pt-20 lg:pt-[88px] pb-0 overflow-hidden relative"
    >
      <div className="max-w-[1380px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Centred Eyebrow & Headline */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_CONFIG}
          variants={headerVariants}
          className="text-center max-w-4xl mx-auto mb-10 sm:mb-12 lg:mb-14"
        >
          <span className="text-[13px] sm:text-[14px] lg:text-[15px] font-bold tracking-tight text-[#FE6000] uppercase mb-3 block">
            {eyebrow}
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-medium leading-[1.08] tracking-[-0.035em] text-white">
            {headline}
          </h2>
        </motion.div>

        {/* 2-Part Composition: Left 2x2 Feature Grid (Top-aligned) + Right Grounded Cutout Subject */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start relative">
          {/* Left: 2x2 Information Grid (~65% width on desktop) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_CONFIG}
            variants={featureContainerVariants}
            className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-10 lg:gap-y-12 pb-12 sm:pb-16 lg:pb-24"
          >
            {items.map((item, index) => (
              <motion.div
                key={item.title}
                variants={featureItemVariants}
                className="flex flex-col items-start"
              >
                {/* Black Circular Icon Tile with Lime Linework */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 sm:mb-5 flex-shrink-0 shadow-sm">
                  {index === 0 && (
                    /* 01: One enquiry for related jobs (Connected central hub) */
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 stroke-[#FE6000] stroke-[1.8] fill-none"
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v4" />
                      <path d="M12 18v4" />
                      <path d="M2 12h4" />
                      <path d="M18 12h4" />
                      <path d="m4.93 4.93 2.83 2.83" />
                      <path d="m16.24 16.24 2.83 2.83" />
                      <path d="m4.93 19.07 2.83-2.83" />
                      <path d="m16.24 7.76 2.83-2.83" />
                    </svg>
                  )}
                  {index === 1 && (
                    /* 02: Details before decisions (Checklist / inspection clipboard) */
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 stroke-[#FE6000] stroke-[1.8] fill-none"
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      <path d="m9 14 2 2 4-4" />
                      <path d="M9 10h6" />
                    </svg>
                  )}
                  {index === 2 && (
                    /* 03: One service is fine too (Focused standalone service tile) */
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 stroke-[#FE6000] stroke-[1.8] fill-none"
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  )}
                  {index === 3 && (
                    /* 04: Plan around your dates (Calendar date planning) */
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 stroke-[#FE6000] stroke-[1.8] fill-none"
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <circle cx="12" cy="15" r="1.5" />
                    </svg>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-2.5 leading-snug tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="text-[15px] sm:text-base text-white/85 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: Prominent Cutout Subject Image Grounded Flush at Bottom */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_CONFIG}
            variants={cutoutVariants}
            className="lg:col-span-5 xl:col-span-4 flex justify-center lg:justify-end items-end relative"
          >
            <div className="relative w-full max-w-[380px] sm:max-w-[420px] lg:max-w-[460px] xl:max-w-[500px] h-[520px] sm:h-[600px] lg:h-[680px] xl:h-[740px] flex items-end justify-center lg:justify-end">
              <Image
                src={cutoutImageSrc}
                alt={cutoutAltText}
                fill
                priority
                sizes="(max-width: 640px) 340px, (max-width: 1024px) 440px, 500px"
                className="object-contain object-bottom drop-shadow-[0_20px_35px_rgba(32,32,36,0.18)]"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
