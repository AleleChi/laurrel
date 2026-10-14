'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Layers } from 'lucide-react';
import { Button } from '../ui/Button';
import { siteConfig } from '@/content/site';

interface AboutSectionProps {
  onOpenQuote: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onOpenQuote }) => {
  const { about } = siteConfig;
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Intersection Observer for restrained scroll-triggered entrance
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (motionQuery.matches) {
        setPrefersReducedMotion(true);
        setIsVisible(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect(); // Fire once
          }
        },
        {
          threshold: 0.15,
          rootMargin: '0px 0px -50px 0px',
        }
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => observer.disconnect();
    }
  }, []);

  // Base animation helper class
  const anim = (delayClass: string) => {
    if (prefersReducedMotion) return 'opacity-100 translate-y-0';
    return `transition-all duration-700 ease-out ${delayClass} ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
    }`;
  };

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-16 sm:py-20 lg:py-28 xl:py-32 bg-[var(--warm-white)] overflow-hidden"
      aria-labelledby="about-heading"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* UPPER PORTION: Eyebrow + Large Editorial H2 */}
        <div className="max-w-4xl">
          {/* Eyebrow Badge */}
          <div
            className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/[0.04] border border-black/[0.07] mb-5 sm:mb-6 ${anim(
              'delay-100'
            )}`}
          >
            <span
              className="w-2 h-2 rounded-full bg-[var(--brand-lime)]"
              aria-hidden="true"
            />
            <span className="text-xs sm:text-[13px] font-bold tracking-[0.14em] uppercase text-[#202024]/85">
              {about.eyebrow}
            </span>
          </div>

          {/* Large Editorial Headline */}
          <h2
            id="about-heading"
            className={`text-3xl sm:text-4xl lg:text-[3.25rem] xl:text-[3.65rem] font-extrabold tracking-tight text-[#390044] leading-[1.12] ${anim(
              'delay-200'
            )}`}
          >
            {about.headline}
          </h2>
        </div>

        {/* LOWER PORTION: Asymmetrical Composition */}
        {/* On mobile: Stacks in exact order: Body Text -> Photograph -> Info Element -> CTA */}
        {/* On desktop (lg): 12-column asymmetrical layout */}
        <div className="mt-10 sm:mt-12 lg:mt-16 flex flex-col lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16 items-start">
          
          {/* 1. Photograph (Mobile order-2, Desktop Left Col 1-7, Row 1-3) */}
          <div
            className={`order-2 lg:order-1 lg:col-span-7 lg:row-span-3 w-full mb-8 lg:mb-0 ${anim(
              'delay-200'
            )}`}
          >
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] xl:aspect-[16/11] rounded-3xl overflow-hidden border border-black/[0.08] shadow-card-soft bg-neutral-100 group">
              <Image
                src={about.media.imageSrc}
                alt={about.media.altText}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 58vw, 750px"
                className="object-cover object-[center_40%] transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
              {/* Subtle ambient lighting vignette */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* 2. Body Text & Supporting Statement (Mobile order-1, Desktop Right Col 8-12, Row 1) */}
          <div
            className={`order-1 lg:order-2 lg:col-span-5 lg:col-start-8 w-full mb-6 lg:mb-6 ${anim(
              'delay-300'
            )}`}
          >
            {/* Supporting Editorial Statement */}
            <div className="border-l-2 border-[var(--brand-lime)] pl-4 sm:pl-5 py-1 mb-5 sm:mb-6">
              <p className="text-lg sm:text-xl lg:text-[1.25rem] font-bold text-[#202024] leading-snug tracking-tight">
                {about.editorialStatement}
              </p>
            </div>

            {/* Two Readable Paragraphs */}
            <div className="space-y-4 text-base sm:text-[16px] lg:text-[17px] text-[#575757] leading-relaxed font-normal">
              {about.paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>

          {/* 3. Small Information Element (Mobile order-3, Desktop Right Col 8-12, Row 2) */}
          <div
            className={`order-3 lg:order-3 lg:col-span-5 lg:col-start-8 w-full mb-7 sm:mb-8 lg:mb-6 ${anim(
              'delay-350'
            )}`}
          >
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.08] shadow-card-soft">
              <div className="flex items-start gap-3.5 sm:gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#C8E80B]/25 border border-[#C8E80B]/40 flex items-center justify-center text-[#557A00] mt-0.5">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-[15px] font-bold text-[#202024] leading-snug">
                    {about.informationCard.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#575757] mt-0.5 leading-relaxed">
                    {about.informationCard.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Restrained CTA (Mobile order-4, Desktop Right Col 8-12, Row 3) */}
          <div
            className={`order-4 lg:order-4 lg:col-span-5 lg:col-start-8 w-full ${anim(
              'delay-450'
            )}`}
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={onOpenQuote}
              className="w-full sm:w-auto"
            >
              {about.cta.label}
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
};
