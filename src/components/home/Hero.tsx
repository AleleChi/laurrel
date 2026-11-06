'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { siteConfig, HeroSlideItem } from '@/content/site';
import { getHomeHeroData, isCmsConfigured } from '@/sanity/client';

interface HeroProps {
  onOpenQuote: (service?: 'cleaning' | 'moving' | 'storage') => void;
  initialData?: typeof siteConfig.hero;
}

const DEFAULT_SLIDES: HeroSlideItem[] = [
  {
    id: 'hero-slide-cleaning',
    serviceKey: 'cleaning',
    serviceLabel: 'Cleaning',
    imageSrc: '/assets/images/laurrel-cleaning-slide.webp',
    altText: 'Cleaner wiping a countertop in a bright residential interior.',
    order: 1,
    objectPosition: '70% 30%',
  },
  {
    id: 'hero-slide-moving',
    serviceKey: 'moving',
    serviceLabel: 'Moving',
    imageSrc: '/assets/images/laurrel-moving-slide.webp',
    altText: 'Movers carrying wrapped household furniture towards a moving truck.',
    order: 2,
    objectPosition: '60% 40%',
  },
  {
    id: 'hero-slide-storage',
    serviceKey: 'storage',
    serviceLabel: 'Storage Solutions',
    imageSrc: '/assets/images/laurrel-storage-solutions-slide.webp',
    altText: 'Packed boxes and protected household belongings arranged for storage.',
    order: 3,
    objectPosition: '65% 50%',
  },
];

export const Hero: React.FC<HeroProps> = ({ onOpenQuote, initialData }) => {
  const [hero, setHero] = useState(initialData || siteConfig.hero);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialData) {
      setHero(initialData);
    } else if (isCmsConfigured) {
      getHomeHeroData()
        .then((res) => {
          if (res?.data) {
            setHero(res.data);
          }
        })
        .catch(() => {});
    }
  }, [initialData]);

  // Check for prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, []);

  // Determine active slides list
  const slides: HeroSlideItem[] = React.useMemo(() => {
    // 1. If slides array is configured and contains valid slides, use it
    if (hero.media?.slides && Array.isArray(hero.media.slides) && hero.media.slides.length > 0) {
      const validSlides = hero.media.slides.filter(s => s && s.imageSrc);
      if (validSlides.length > 0) {
        return [...validSlides].sort((a, b) => (a.order || 0) - (b.order || 0));
      }
    }
    // 2. If single custom imageSrc provided that is NOT an outdated legacy path (/assets/hero/cleaning-hero or laurrel-room)
    if (
      hero.media?.imageSrc &&
      hero.media.imageSrc !== DEFAULT_SLIDES[0].imageSrc &&
      !hero.media.imageSrc.includes('cleaning-hero') &&
      !hero.media.imageSrc.includes('laurrel-room') &&
      !hero.media.imageSrc.startsWith('/assets/hero/')
    ) {
      return [
        {
          ...DEFAULT_SLIDES[0],
          imageSrc: hero.media.imageSrc,
          altText: hero.media.altText || DEFAULT_SLIDES[0].altText,
        },
        DEFAULT_SLIDES[1],
        DEFAULT_SLIDES[2],
      ];
    }
    // 3. Fall back strictly to approved DEFAULT_SLIDES under /assets/images/
    return DEFAULT_SLIDES;
  }, [hero.media]);

  // Auto-advance function
  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // Handle visibility changes (tab backgrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Setup rotation interval (5 seconds)
  useEffect(() => {
    if (isPaused || prefersReducedMotion || slides.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, prefersReducedMotion, slides.length, nextSlide]);

  return (
    <section
      className="relative pt-3 pb-8 sm:pt-6 sm:pb-12 lg:pt-8 lg:pb-14 overflow-hidden"
      aria-label="Hero Introduction"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Typographic & Action Content (~48% of layout) - Remains completely stationary */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2.5 mb-4 sm:mb-5">
              <span className="w-6 sm:w-8 h-[3px] bg-[#FE6000] rounded-full inline-block" />
              <span className="text-xs sm:text-[13px] font-bold tracking-[0.16em] uppercase text-[#202024]/85">
                {hero.eyebrow}
              </span>
            </div>

            {/* H1 Headline */}
            <h1 className="text-[2.5rem] sm:text-[3.25rem] lg:text-[3.8rem] xl:text-[4.3rem] font-extrabold tracking-tight leading-[1.08] text-[#49056B]">
              <span className="block">{hero.headline.line1}</span>
              <span className="block text-[#FE6000]">{hero.headline.line2}</span>
              {hero.headline.line3 ? (
                <span className="block">{hero.headline.line3}</span>
              ) : null}
            </h1>

            {/* Explanatory Body Copy */}
            <p className="mt-5 sm:mt-6 text-base sm:text-lg text-[#575757] leading-relaxed max-w-xl font-normal">
              {hero.body}
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onOpenQuote()}
                className="w-full sm:w-auto"
              >
                {hero.primaryCta.label}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                href="#services"
                className="w-full sm:w-auto"
              >
                {hero.secondaryCta.label}
              </Button>
            </div>

            {/* Supporting Compact Planning Card */}
            <div className="mt-8 sm:mt-10 bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.08] shadow-card-soft max-w-lg">
              <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#FE6000]/15 border border-[#FE6000]/30 flex items-center justify-center text-[#FE6000] mt-0.5 sm:mt-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="text-sm font-bold text-[#202024] leading-snug">
                    {hero.supportCard.heading}
                  </h3>
                  <p className="text-xs text-[#575757] mt-0.5 leading-relaxed">
                    {hero.supportCard.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenQuote()}
                  className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[#49056B] hover:text-[#FE6000] transition-colors py-1 pl-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49056B] rounded whitespace-nowrap self-center cursor-pointer"
                >
                  <span>{hero.supportCard.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Smooth Three-Image Slider (~52% of layout) */}
          <div className="lg:col-span-6 xl:col-span-6 w-full">
            <div
              className="relative w-full aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] xl:aspect-[16/11] rounded-2xl overflow-hidden border border-black/[0.08] shadow-card-soft bg-[#202024]"
              role="region"
              aria-roledescription="carousel"
              aria-label="Laurrel Services hero photography"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
            >
              {slides.map((slide, index) => {
                const isActive = index === activeIndex;
                return (
                  <div
                    key={slide.id || index}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${slide.serviceLabel} (${index + 1} of ${slides.length})`}
                    aria-hidden={!isActive}
                    className={`absolute inset-0 transition-opacity ${
                      prefersReducedMotion ? 'duration-0' : 'duration-[800ms]'
                    } ease-in-out ${
                      isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    <Image
                      src={slide.imageSrc}
                      alt={slide.altText}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 680px"
                      className="object-cover"
                      style={{ objectPosition: slide.objectPosition || 'center center' }}
                    />
                  </div>
                );
              })}

              {/* Discreet, restrained slide indicators */}
              {slides.length > 1 && (
                <div
                  className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-1.5 pointer-events-auto"
                  role="tablist"
                  aria-label="Hero slide navigation"
                >
                  {slides.map((s, idx) => {
                    const isSelected = idx === activeIndex;
                    return (
                      <button
                        key={s.id || idx}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        aria-label={`Select ${s.serviceLabel} slide (${idx + 1} of ${slides.length})`}
                        onClick={() => setActiveIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer ${
                          isSelected
                            ? 'w-7 bg-white shadow-xs'
                            : 'w-2 bg-white/45 hover:bg-white/75'
                        }`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
