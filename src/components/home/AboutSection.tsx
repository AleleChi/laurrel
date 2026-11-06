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
    if (initialData) {
      setAbout(initialData);
    }
  }, [initialData]);

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
      className="relative py-12 sm:py-16 lg:py-20 xl:py-24 bg-[var(--warm-white)] scroll-mt-28 sm:scroll-mt-32"
      aria-labelledby="home-about-heading"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP: Section Label & Large Editorial H2 */}
        <div className="max-w-4xl mb-10 sm:mb-12 lg:mb-14">
          {/* Plain uppercase text label — strictly no badges, pills, or circular dots */}
          <p
            className={`text-xs sm:text-[13px] lg:text-[14px] font-bold tracking-[0.14em] uppercase text-[#49056B] mb-3 sm:mb-4 ${anim(
              'delay-100'
            )}`}
          >
            {about.eyebrow}
          </p>

          <h2
            id="home-about-heading"
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-[3.75rem] font-extrabold tracking-tight text-[#49056B] leading-[1.14] ${anim(
              'delay-200'
            )}`}
          >
            {about.headline}
          </h2>
        </div>

        {/* MIDDLE: Three-column Editorial Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 xl:gap-12 items-start">
          
          {/* LEFT COLUMN: Intro paragraph */}
          <div className="lg:col-span-4 flex flex-col order-1">
            <p
              className={`text-base sm:text-[17px] lg:text-[18px] text-[#575757] leading-relaxed font-normal max-w-prose ${anim(
                'delay-250'
              )}`}
            >
              {about.introParagraph}
            </p>
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
                className="object-cover object-center"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Service descriptions + About CTA */}
          <div className="lg:col-span-4 flex flex-col order-3">
            <h3
              className={`text-2xl sm:text-3xl font-extrabold text-[#49056B] tracking-tight leading-snug mb-6 sm:mb-7 ${anim(
                'delay-250'
              )}`}
            >
              {about.rightHeading}
            </h3>

            {/* Three distinct service text groups — no checkmarks, icons, or artificial lines */}
            <div className="space-y-6 sm:space-y-7">
              {about.services.map((service, idx) => (
                <div
                  key={service.title || idx}
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
          </div>

        </div>

      </div>
    </section>
  );
};
