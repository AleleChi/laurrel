'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MOTION_EASE, MOTION_DURATIONS, VIEWPORT_CONFIG } from '@/utils/motion';

interface FaqItem {
  question: string;
  answer: string;
}

interface AboutFaqSectionProps {
  eyebrow: string;
  headline: string;
  intro: string;
  items: FaqItem[];
  imageSrc: string;
  altText: string;
}

export const AboutFaqSection: React.FC<AboutFaqSectionProps> = ({
  eyebrow,
  headline,
  intro,
  items,
  imageSrc,
  altText,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  const toggleItem = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  // Image animation
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

  // Header animation
  const headerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
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

  return (
    <section
      aria-label="Frequently Asked Questions"
      className="w-full bg-[#F8F7F4] border-t border-[#202024]/10 py-20 sm:py-24 lg:py-28 overflow-hidden"
    >
      <div className="max-w-[1380px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Dominant Photograph (Left Column, ~42% width) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_CONFIG}
            variants={imageVariants}
            className="lg:col-span-5 w-full flex justify-center lg:justify-start lg:sticky lg:top-28"
          >
            <div className="relative w-full max-w-[540px] h-[480px] sm:h-[580px] lg:h-[640px] rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-sm bg-[#202024]/5">
              <Image
                src={imageSrc}
                alt={altText}
                fill
                loading="eager"
                sizes="(max-width: 1024px) 100vw, 540px"
                className="object-cover object-center"
              />
            </div>
          </motion.div>

          {/* FAQ Editorial Header + Interactive Accordion (Right Column, ~58% width) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_CONFIG}
            variants={headerContainerVariants}
            className="lg:col-span-7 flex flex-col justify-start lg:pl-2"
          >
            {/* Section Eyebrow Label */}
            <motion.span
              variants={headerItemVariants}
              className="text-[14px] sm:text-[16px] font-bold tracking-tight uppercase text-[#390044] mb-3 sm:mb-4 block"
            >
              {eyebrow}
            </motion.span>

            {/* Editorial Heading */}
            <motion.h2
              variants={headerItemVariants}
              className="text-3xl sm:text-5xl lg:text-[52px] font-bold leading-[1.08] tracking-[-0.035em] text-[#202024] mb-4"
            >
              {headline}
            </motion.h2>

            {/* Brief Supporting Introduction */}
            <motion.p
              variants={headerItemVariants}
              className="text-base sm:text-lg text-[#202024]/80 leading-relaxed mb-8 max-w-2xl"
            >
              {intro}
            </motion.p>

            {/* Accessible Accordion with Smooth Height & Opacity Transitions */}
            <motion.div
              variants={headerItemVariants}
              className="divide-y divide-[#202024]/15 border-t border-b border-[#202024]/15"
            >
              {items.map((item, idx) => {
                const isOpen = openIndex === idx;
                const buttonId = `faq-btn-${idx}`;
                const panelId = `faq-panel-${idx}`;

                return (
                  <div key={item.question} className="py-5 sm:py-6">
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggleItem(idx)}
                      className="w-full flex items-center justify-between text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#390044] rounded"
                    >
                      <span className="text-lg sm:text-xl font-medium text-[#202024] group-hover:text-[#390044] transition-colors duration-200 pr-6">
                        {item.question}
                      </span>
                      <span
                        className="text-2xl font-light text-[#202024]/60 group-hover:text-[#390044] shrink-0 w-6 text-center select-none inline-block transition-transform duration-300"
                        style={{
                          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                        }}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{
                            height: 'auto',
                            opacity: 1,
                            transition: {
                              height: shouldReduceMotion
                                ? { duration: 0 }
                                : { duration: 0.32, ease: MOTION_EASE },
                              opacity: shouldReduceMotion
                                ? { duration: 0 }
                                : { duration: 0.25, delay: 0.05, ease: 'easeOut' },
                            },
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                              height: shouldReduceMotion
                                ? { duration: 0 }
                                : { duration: 0.25, ease: MOTION_EASE },
                              opacity: shouldReduceMotion
                                ? { duration: 0 }
                                : { duration: 0.15, ease: 'easeIn' },
                            },
                          }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3.5 pb-1 text-base sm:text-lg text-[#202024]/80 leading-relaxed max-w-2xl">
                            <p>{item.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
