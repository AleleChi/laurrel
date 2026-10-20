'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { siteConfig } from '@/content/site';
import { getHomeAboutData, isCmsConfigured } from '@/sanity/client';

interface AboutSectionProps {
  onOpenQuote?: () => void;
  initialData?: typeof siteConfig.about;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ initialData }) => {
  const [about, setAbout] = useState(initialData || siteConfig.about);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (isCmsConfigured && !initialData) {
      getHomeAboutData().then((res) => {
        if (res?.data) {
          setAbout(res.data);
        }
      }).catch(() => {});
    }
  }, [initialData]);

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
            observer.disconnect();
          }
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -40px 0px',
        }
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => observer.disconnect();
    }
  }, []);

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
      className="relative py-16 sm:py-20 lg:py-28 xl:py-32 bg-[var(--warm-white)] scroll-mt-28"
      aria-labelledby="home-about-heading"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP: Section Label & Large Editorial H2 */}
        <div className="max-w-4xl mb-12 sm:mb-14 lg:mb-16">
          {/* Plain uppercase text label — strictly no badges, pills, or circular dots */}
          <p
            className={`text-xs sm:text-[13px] lg:text-[14px] font-bold tracking-[0.14em] uppercase text-[#49056B] mb-4 sm:mb-5 ${anim(
              'delay-100'
            )}`}
          >
            {about.eyebrow}
          </p>

          <h2
            id="home-about-heading"
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-extrabold tracking-tight text-[#49056B] leading-[1.1] ${anim(
              'delay-200'
            )}`}
          >
            {about.headline}
          </h2>
        </div>

        {/* MIDDLE: Three-column Editorial Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-8 xl:gap-12 items-start">
          
          {/* LEFT COLUMN: Intro paragraph + Oversized 03 Stat (Desktop) */}
          <div className="lg:col-span-4 flex flex-col justify-between self-stretch order-1">
            <div>
              <p
                className={`text-base sm:text-[17px] lg:text-[18px] text-[#575757] leading-relaxed font-normal ${anim(
                  'delay-250'
                )}`}
              >
                {about.introParagraph}
              </p>
            </div>

            {/* Oversized number 03 and caption — Desktop layout */}
            <div
              className={`hidden lg:block pt-6 xl:pt-8 mt-auto ${anim(
                'delay-350'
              )}`}
            >
              <div
                className="text-[140px] xl:text-[170px] 2xl:text-[190px] font-extrabold text-[#49056B] leading-none tracking-tight select-none"
                aria-label="03 Core Services"
              >
                {about.stat.number}
              </div>
              <p className="text-xs sm:text-[13px] font-bold tracking-[0.12em] uppercase text-[#202024]/80 mt-2">
                {about.stat.caption}
              </p>
            </div>
          </div>

          {/* CENTRE COLUMN: Prominent Portrait Photograph */}
          <div className="lg:col-span-4 w-full order-2">
            <div
              className={`relative w-full aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] rounded-3xl overflow-hidden border border-black/[0.08] shadow-card-soft bg-neutral-100 ${anim(
                'delay-300'
              )}`}
            >
              <Image
                src={about.media.imageSrc}
                alt={about.media.altText}
                fill
                loading="eager"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 38vw, 420px"
                className="object-cover object-[center_35%]"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Service descriptions + About CTA */}
          <div className="lg:col-span-4 flex flex-col order-3">
            <h3
              className={`text-2xl sm:text-3xl font-extrabold text-[#49056B] tracking-tight leading-snug mb-6 sm:mb-8 ${anim(
                'delay-250'
              )}`}
            >
              {about.rightHeading}
            </h3>

            {/* Three distinct service text groups — no checkmarks, icons, or artificial lines */}
            <div className="space-y-6 sm:space-y-7">
              {about.services.map((service, idx) => (
                <div
                  key={service.title}
                  className={anim(`delay-${300 + idx * 75}`)}
                >
                  <h4 className="text-base sm:text-[17px] font-bold text-[#202024] mb-1.5">
                    {service.title}
                  </h4>
                  <p className="text-sm sm:text-[15px] text-[#575757] leading-relaxed font-normal">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Single CTA linking to /about (without arrow icon) */}
            <div className={`mt-8 sm:mt-10 ${anim('delay-500')}`}>
              <Link href={about.cta.href}>
                <Button
                  variant="primary"
                  size="lg"
                  icon={false}
                  className="w-full sm:w-auto"
                >
                  {about.cta.label}
                </Button>
              </Link>
            </div>

            {/* Mobile / Tablet presentation of Oversized 03 Stat — clean & non-dominating */}
            <div
              className={`lg:hidden mt-10 pt-8 border-t border-black/5 flex items-baseline gap-4 ${anim(
                'delay-550'
              )}`}
            >
              <span className="text-6xl sm:text-7xl font-extrabold text-[#49056B] leading-none tracking-tight">
                {about.stat.number}
              </span>
              <span className="text-xs sm:text-sm font-bold tracking-[0.14em] uppercase text-[#202024]/75">
                {about.stat.caption}
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
