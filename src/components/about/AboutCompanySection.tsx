'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION_EASE, MOTION_DURATIONS, VIEWPORT_CONFIG } from '@/utils/motion';

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
  const shouldReduceMotion = useReducedMotion();

  // Left Image Animation
  const imageVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 20,
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

  // Right Column Staggered Container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.09,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  // Child Elements Animation
  const itemVariants = {
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

  return (
    <section className="w-full bg-[#F8F7F4] py-20 sm:py-24 lg:py-32 overflow-hidden border-b border-[#202024]/10">
      <div className="max-w-[1380px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-center">
          
          {/* 1. Dominant Left Editorial Image Column (~42% width) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_CONFIG}
            variants={imageVariants}
            className="lg:col-span-5 w-full flex justify-center lg:justify-start"
          >
            <div className="relative w-full max-w-[540px] h-[500px] sm:h-[600px] lg:h-[660px] xl:h-[680px] rounded-[28px] sm:rounded-[32px] overflow-hidden bg-[#202024]/5 shadow-sm">
              <Image
                src={imageSrc}
                alt={altText}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 540px"
                className="object-cover object-left sm:object-center"
              />
            </div>
          </motion.div>

          {/* 2. Dominant Right Editorial Content Column (~58% width) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_CONFIG}
            variants={containerVariants}
            className="lg:col-span-7 flex flex-col justify-center lg:pl-2 xl:pl-4"
          >
            {/* Eyebrow Label */}
            <motion.span
              variants={itemVariants}
              className="text-[14px] sm:text-[16px] font-bold tracking-tight uppercase text-[#390044] mb-4 sm:mb-5 block"
            >
              {eyebrow}
            </motion.span>

            {/* Massive Dominant H2 Headline */}
            <motion.h2
              variants={itemVariants}
              className="text-4xl sm:text-6xl lg:text-[68px] xl:text-[76px] font-bold leading-[0.98] tracking-[-0.04em] text-[#202024] mb-6 sm:mb-8"
            >
              Cleaning, moving and storage.<br className="hidden sm:inline" /> All in one place.
            </motion.h2>

            {/* Editorial Paragraphs */}
            <motion.div
              variants={itemVariants}
              className="space-y-4 sm:space-y-5 text-base sm:text-lg xl:text-[19px] leading-[1.6] text-[#202024]/80 mb-8 max-w-[620px]"
            >
              <p>{paragraph1}</p>
              <p>{paragraph2}</p>
            </motion.div>

            {/* Two-Point Feature Row */}
            <motion.div
              variants={itemVariants}
              className="border-t border-b border-[#202024]/15 py-6 mb-10 max-w-[620px] grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              {emphasisPoints.map((item, index) => (
                <div key={item.id || index} className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#390044]/10 text-[#390044] flex items-center justify-center shrink-0 mt-0.5">
                    {index === 0 ? (
                      /* Icon 1: Verified Service Booking (Rosette / Shield Check) */
                      <svg
                        className="w-5 h-5 fill-current"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M12 2l2.4 2.2 3.2-.4 1.3 2.9 3 .9-.3 3.2 2 2.5-2 2.5.3 3.2-3 .9-1.3 2.9-3.2-.4L12 22l-2.4-2.2-3.2.4-1.3-2.9-3-.9.3-3.2-2-2.5 2-2.5-.3-3.2 3-.9 1.3-2.9 3.2.4L12 2zm-1.4 14.2l6-6-1.4-1.4-4.6 4.6-2.2-2.2-1.4 1.4 3.6 3.6z" />
                      </svg>
                    ) : (
                      /* Icon 2: Connected Multi-Service Coordination */
                      <svg
                        className="w-5 h-5 fill-current"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M12 2L2 7l10 5 10-5-10-5zm0 8.5L4.5 7 12 3.5 19.5 7 12 10.5zm-8 4.3l8 4 8-4v2.5l-8 4-8-4v-2.5zm0-4.3l8 4 8-4v2.5l-8 4-8-4v-2.5z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-[15px] sm:text-[16px] font-semibold text-[#202024] leading-snug">
                    {item.text}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* Solshine-Style Premium CTA Button with Hover Arrow Animation */}
            <motion.div variants={itemVariants} className="pt-1">
              <Link
                href={cta.href}
                className="group inline-flex items-center justify-between h-[58px] sm:h-[62px] pl-7 pr-2.5 bg-[#C8E80B] hover:bg-[#b5d309] rounded-full transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#390044]"
              >
                <span className="text-[16px] sm:text-[17px] font-bold text-[#202024] tracking-tight pr-2">
                  {cta.label}
                </span>
                <span className="w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shrink-0 ml-4 shadow-sm transition-transform duration-200 group-hover:translate-x-1">
                  <svg
                    className="w-5 h-5 text-[#202024] stroke-current stroke-[2] fill-none"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </Link>
            </motion.div>

          </motion.div>

        </div>
      </div>
    </section>
  );
};
