'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CleaningIllustration,
  MovingIllustration,
  StorageIllustration,
} from '@/components/icons/services';
import { siteConfig, ServicesHighlightConfig } from '@/content/site';
import { getHomeServicesData, isCmsConfigured } from '@/sanity/client';
import { useState, useEffect } from 'react';

interface ServicesHighlightSectionProps {
  content?: ServicesHighlightConfig;
}

export const ServicesHighlightSection: React.FC<ServicesHighlightSectionProps> = ({
  content,
}) => {
  const [activeContent, setActiveContent] = useState<ServicesHighlightConfig>(
    content || siteConfig.servicesHighlight
  );

  useEffect(() => {
    if (isCmsConfigured && !content) {
      getHomeServicesData().then((res) => {
        if (res?.data) {
          setActiveContent(res.data);
        }
      }).catch(() => {});
    }
  }, [content]);

  const shouldReduceMotion = useReducedMotion();

  // Left Column Animation Variants
  const containerVariants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.6,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  // Row Animation Variants
  const rowVariants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.65,
        delay: shouldReduceMotion ? 0 : 0.2 + i * 0.15,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    }),
  };

  // Map service ID to corresponding illustration component
  const getIllustration = (id: string) => {
    switch (id) {
      case 'cleaning':
        return <CleaningIllustration />;
      case 'moving':
        return <MovingIllustration />;
      case 'storage':
        return <StorageIllustration />;
      default:
        return null;
    }
  };

  return (
    <section
      id="services"
      aria-label="Laurrel Services Overview"
      className="w-full bg-[#C8E80B] text-[#202024] py-20 sm:py-24 lg:py-28 xl:py-[108px] px-6 sm:px-8 lg:px-12 xl:px-16"
    >
      <div className="max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-24 items-start">
          {/* ========================================================= */}
          {/* LEFT COLUMN: Eyebrow + Editorial H2 + Black CTA Button    */}
          {/* ========================================================= */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="lg:col-span-5 xl:col-span-5 flex flex-col items-start pt-2"
          >
            {/* 1. Small Eyebrow */}
            <motion.div
              variants={itemVariants}
              className="text-xs sm:text-sm font-bold tracking-[0.14em] uppercase text-[#18181B] mb-5 sm:mb-6"
            >
              {activeContent.eyebrow}
            </motion.div>

            {/* 2. Large Editorial Headline */}
            <motion.h2
              variants={itemVariants}
              className="text-[36px] sm:text-[46px] md:text-[52px] lg:text-[56px] xl:text-[62px] 2xl:text-[68px] font-medium tracking-[-0.035em] leading-[1.08] text-[#18181B] mb-8 sm:mb-10 lg:mb-14 max-w-[540px]"
            >
              {activeContent.headline}
            </motion.h2>

            {/* 3. Black CTA Button with White Arrow Holder */}
            <motion.div variants={itemVariants}>
              <Link
                href={activeContent.cta.href}
                className="group relative inline-flex items-center justify-between gap-5 bg-[#18181B] hover:bg-black text-white pl-7 pr-3 py-2.5 rounded-[50px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B] shadow-sm hover:shadow-md cursor-pointer"
                aria-label={`${activeContent.cta.label} — Navigate to dedicated Services page`}
              >
                <span className="text-[17px] sm:text-[18px] font-medium tracking-tight text-white pr-2 select-none">
                  {activeContent.cta.label}
                </span>

                {/* White Arrow Holder */}
                <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 transition-transform duration-250 ease-out group-hover:scale-105">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#18181B"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transform transition-transform duration-250 ease-out group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </Link>
            </motion.div>
          </motion.div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: 3 Service Rows with Animated Illustrations  */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col space-y-12 sm:space-y-14 lg:space-y-16 pt-2 lg:pt-3">
            {activeContent.services.map((service, index) => (
              <motion.div
                key={service.id}
                custom={index}
                variants={rowVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="group flex flex-col sm:flex-row items-start gap-6 sm:gap-8 lg:gap-10"
              >
                {/* Left Illustration Box */}
                <div
                  className="w-24 h-24 sm:w-24 sm:h-24 lg:w-[104px] lg:h-[104px] flex-shrink-0 flex items-start justify-center pt-0.5"
                  aria-hidden="true"
                >
                  {getIllustration(service.id)}
                </div>

                {/* Right Text Column */}
                <div className="flex-1 max-w-[620px]">
                  <h3 className="text-2xl sm:text-[26px] lg:text-[28px] font-semibold text-[#18181B] tracking-[-0.02em] leading-snug mb-2 sm:mb-3">
                    {service.title}
                  </h3>
                  <p className="text-base sm:text-[17px] lg:text-[18px] font-normal text-[#202024]/90 leading-[1.62]">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
