'use client';

import React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION_EASE, MOTION_DURATIONS, VIEWPORT_CONFIG } from '@/utils/motion';

export interface WhyPoint {
  id?: string;
  title: string;
  description: string;
  icon?: string;
}

export interface AboutWhySectionProps {
  eyebrow: string;
  headline: string;
  intro?: string;
  paragraph1?: string;
  paragraph2?: string;
  items?: WhyPoint[];
  imageSrc?: string;
  altText?: string;
  cutoutImageSrc?: string;
  cutoutAltText?: string;
}

export const AboutWhySection: React.FC<AboutWhySectionProps> = ({
  eyebrow = 'HOW WE WORK',
  headline = 'Every job has its own details.',
  intro,
  paragraph1,
  paragraph2,
  imageSrc,
  altText,
  cutoutImageSrc,
  cutoutAltText,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Determine copy text
  let p1 = paragraph1;
  let p2 = paragraph2;

  if (!p1 && intro) {
    const parts = intro.split('\n\n');
    p1 = parts[0];
    p2 = parts[1] || '';
  }

  p1 =
    p1 ||
    'A regular home clean is different from preparing a property for new occupants. Moving a few pieces of furniture is different from relocating an entire household. And sometimes, belongings need somewhere to stay between addresses.';

  p2 =
    p2 ||
    "That’s why the details matter. Tell us what needs doing, where and when, and we’ll help you understand the next steps.";

  const activeImage =
    imageSrc || cutoutImageSrc || '/assets/about/about-how-we-work.webp';
  const activeAlt =
    altText ||
    cutoutAltText ||
    'Professional team carefully preparing, packing, and organizing household belongings in a bright Ottawa residence';

  // Animation variants
  const leftColVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 20,
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

  const imageVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 24,
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

  return (
    <section
      id="how-we-work"
      aria-label="How We Work"
      className="w-full bg-[#49056B] text-white py-16 sm:py-20 lg:py-24 relative overflow-hidden scroll-mt-28"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-center">
          {/* Left Column: Typographic Editorial (~58% on desktop) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_CONFIG}
            variants={leftColVariants}
            className="lg:col-span-7 flex flex-col justify-center"
          >
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2.5 mb-4 sm:mb-5">
              <span className="w-6 sm:w-8 h-[3px] bg-[#FE6000] rounded-full inline-block" />
              <span className="text-xs sm:text-[13px] font-bold tracking-[0.16em] uppercase text-white/90">
                {eyebrow}
              </span>
            </div>

            {/* Editorial Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] xl:text-[48px] font-bold text-white tracking-tight leading-[1.12] mb-6 sm:mb-7">
              {headline}
            </h2>

            {/* Paragraph 1 */}
            <p className="text-base sm:text-lg text-white/90 leading-relaxed font-normal mb-5 sm:mb-6 max-w-2xl">
              {p1}
            </p>

            {/* Paragraph 2 */}
            <p className="text-base sm:text-lg text-white/90 leading-relaxed font-normal max-w-2xl">
              {p2}
            </p>
          </motion.div>

          {/* Right Column: Single Contemporary Service Photograph (~42% on desktop) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_CONFIG}
            variants={imageVariants}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] rounded-2xl overflow-hidden border border-white/15 bg-white/5 shadow-card-soft">
              <Image
                src={activeImage}
                alt={activeAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 520px"
                className="object-cover object-center"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
