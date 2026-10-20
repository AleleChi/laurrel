'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, Minus, ArrowRight } from 'lucide-react';
import { siteConfig, HomeFaqConfig } from '@/content/site';

interface HomeFaqSectionProps {
  content?: HomeFaqConfig;
}

export const HomeFaqSection: React.FC<HomeFaqSectionProps> = ({
  content = siteConfig.homeFaq,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  const toggleItem = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      id="faq"
      aria-labelledby="home-faq-heading"
      className="w-full py-20 lg:py-28 px-6 sm:px-8 lg:px-12 xl:px-16 bg-[#F8F7F4] border-t border-[#202024]/8"
    >
      <div className="max-w-[1400px] xl:max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
          
          {/* Left Column: Heading & More Link (~35%) */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <span className="text-xs font-bold tracking-widest uppercase text-[#49056B] mb-3">
              {content.eyebrow}
            </span>
            <h2
              id="home-faq-heading"
              className="text-3xl sm:text-4xl lg:text-[46px] font-semibold text-[#18181B] tracking-[-0.025em] leading-[1.15] mb-6"
            >
              {content.headline}
            </h2>
            <p className="text-base sm:text-lg text-[#202024]/75 leading-relaxed font-normal mb-8">
              Practical details on arranging cleaning, moving and storage in Ottawa, individually or together.
            </p>

            <Link
              href={content.moreLink.href}
              className="inline-flex items-center gap-2.5 text-base font-semibold text-[#49056B] hover:text-[#18181B] underline-offset-4 hover:underline transition-colors"
            >
              <span>{content.moreLink.label}</span>
              <ArrowRight className="w-4 h-4 text-[#49056B]" />
            </Link>
          </div>

          {/* Right Column: Accordion Container (~65%) */}
          <div className="lg:col-span-7 bg-white rounded-[32px] sm:rounded-[36px] px-6 sm:px-8 lg:px-10 border border-[#202024]/10 shadow-xs divide-y divide-[#202024]/10">
            {content.items.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} className="py-6 sm:py-7">
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full text-left flex items-start justify-between gap-6 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B] rounded-lg"
                    aria-expanded={isOpen}
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-[#18181B] tracking-tight leading-snug">
                      {item.question}
                    </h3>
                    <span className="w-8 h-8 rounded-full border border-[#202024]/20 flex items-center justify-center flex-shrink-0 text-[#18181B] mt-0.5 transition-colors">
                      {isOpen ? (
                        <Minus className="w-4 h-4 text-[#18181B]" />
                      ) : (
                        <Plus className="w-4 h-4 text-[#18181B]" />
                      )}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                          transition: {
                            height: { duration: shouldReduceMotion ? 0.05 : 0.28, ease: 'easeOut' },
                            opacity: { duration: shouldReduceMotion ? 0.05 : 0.24, delay: 0.05 },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: { duration: shouldReduceMotion ? 0.05 : 0.22, ease: 'easeIn' },
                            opacity: { duration: shouldReduceMotion ? 0.05 : 0.15 },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <p className="text-base sm:text-[17px] text-[#202024]/85 leading-relaxed pt-4 pr-6 sm:pr-10 font-normal">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};
