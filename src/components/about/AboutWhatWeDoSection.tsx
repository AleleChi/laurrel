'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION_EASE, MOTION_DURATIONS, VIEWPORT_CONFIG } from '@/utils/motion';

export interface WhatWeDoColumnItem {
  category: string;
  displayWord: string;
  description: string;
  href?: string;
  // Optional backward compatibility
  title?: string;
  number?: string;
}

interface AboutWhatWeDoSectionProps {
  eyebrow: string;
  headline: string;
  intro: string;
  columns?: WhatWeDoColumnItem[];
  services?: WhatWeDoColumnItem[];
}

export const AboutWhatWeDoSection: React.FC<AboutWhatWeDoSectionProps> = ({
  eyebrow,
  headline,
  intro,
  columns,
  services,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Normalize columns with robust fallback to approved copy
  const rawItems = columns && columns.length > 0 ? columns : services && services.length > 0 ? services : [];
  
  const items: WhatWeDoColumnItem[] = rawItems.length > 0
    ? rawItems.map((col) => ({
        category: col.category || (col.title ? col.title.toUpperCase() : 'SERVICE'),
        displayWord: col.displayWord || (col.title ? `${col.title}.` : 'Service.'),
        description: col.description || '',
        href: col.href || '',
      }))
    : [
        {
          category: 'CLEANING',
          displayWord: 'Clean.',
          description:
            'Move-in, move-out, turnover and post-renovation preparation carried out to dependable standards across Ottawa properties.',
          href: '/#cleaning',
        },
        {
          category: 'MOVING',
          displayWord: 'Move.',
          description:
            'Residential and commercial moving coordinated around your dates, access requirements and property layout.',
          href: '/#moving',
        },
        {
          category: 'STORAGE',
          displayWord: 'Store.',
          description:
            'Secure storage arrangements for transition periods between addresses, renovations or scheduled staging.',
          href: '/#storage',
        },
      ];

  // Motion variants for upper header area
  const headerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const headerItemVariants = {
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

  // Motion variants for lower 3-column area
  const columnsContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const columnItemVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 18,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : MOTION_DURATIONS.deliberate,
        ease: MOTION_EASE,
      },
    },
  };

  const lineVariants = {
    hidden: {
      scaleX: shouldReduceMotion ? 1 : 0,
      opacity: shouldReduceMotion ? 1 : 0,
    },
    visible: {
      scaleX: 1,
      opacity: 1,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.6,
        ease: MOTION_EASE,
      },
    },
  };

  return (
    <section
      aria-label="What We Do - Core Service Information"
      className="w-full bg-[#F8F7F4] border-t border-[#202024]/10 py-20 sm:py-24 lg:py-32 overflow-hidden"
    >
      <div className="max-w-[1380px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Upper Level: Wide Two-Column Arrangement (Headline Left, Paragraph Right) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_CONFIG}
          variants={headerContainerVariants}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-16 items-center mb-16 sm:mb-20 lg:mb-24"
        >
          {/* Column 1: Uppercase Section Label + Dominant Editorial Headline (~58% width) */}
          <motion.div variants={headerItemVariants} className="lg:col-span-7">
            <span className="text-[14px] sm:text-[15px] font-bold tracking-tight uppercase text-[#49056B] mb-3 sm:mb-4 block">
              {eyebrow}
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-[56px] xl:text-[62px] font-medium leading-[1.08] tracking-[-0.035em] text-[#202024]">
              {headline}
            </h2>
          </motion.div>

          {/* Column 2: Supporting Paragraph (~42% width, vertically centered with H2) */}
          <motion.div variants={headerItemVariants} className="lg:col-span-5 flex items-center">
            <p className="text-base sm:text-lg xl:text-[19px] leading-[1.62] text-[#202024]/80 max-w-[560px]">
              {intro}
            </p>
          </motion.div>
        </motion.div>

        {/* Lower Level: Three Typographic Information Columns */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_CONFIG}
          variants={columnsContainerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12 xl:gap-16 items-start"
        >
          {items.map((col, index) => {
            return (
              <motion.div
                key={col.category || index}
                variants={columnItemVariants}
                className="flex flex-col justify-start"
              >
                {/* 1. Small Uppercase Category Label */}
                <div className="mb-3.5 sm:mb-4 h-5 flex items-center">
                  {col.href ? (
                    <Link
                      href={col.href}
                      className="inline-block text-[13px] sm:text-[14px] font-bold tracking-wider uppercase text-[#202024] hover:text-[#49056B] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49056B] rounded"
                    >
                      {col.category}
                    </Link>
                  ) : (
                    <span className="text-[13px] sm:text-[14px] font-bold tracking-wider uppercase text-[#202024]">
                      {col.category}
                    </span>
                  )}
                </div>

                {/* 2. Fine Horizontal Rule with Smooth Horizontal Reveal */}
                <motion.div
                  variants={lineVariants}
                  style={{ originX: 0 }}
                  className="w-full h-[1px] bg-[#202024] mb-6 sm:mb-8"
                  role="separator"
                  aria-hidden="true"
                />

                {/* 3. Large Typographic Statement (Clean. / Move. / Store.) */}
                <div className="mb-5 sm:mb-6">
                  <span className="text-6xl sm:text-7xl lg:text-[84px] xl:text-[96px] font-semibold leading-[0.95] tracking-[-0.04em] text-[#202024] block select-none">
                    {col.displayWord}
                  </span>
                </div>

                {/* 4. Short Service Description */}
                <p className="text-base sm:text-[17px] leading-[1.62] text-[#202024]/75 max-w-[380px]">
                  {col.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
