'use client';

import React, { useState, useEffect } from 'react';
import { siteConfig } from '@/content/site';

interface ServiceTickerProps {
  initialData?: typeof siteConfig.ticker;
}

export const ServiceTicker: React.FC<ServiceTickerProps> = ({ initialData }) => {
  const items = initialData?.items && initialData.items.length > 0
    ? initialData.items
    : siteConfig.ticker.items;

  const [isTabVisible, setIsTabVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  // Repeat sequence 6 times per track for seamless continuity across wide viewports
  const loopSequence = [
    ...items,
    ...items,
    ...items,
    ...items,
    ...items,
    ...items,
  ];

  return (
    <section
      aria-label="Core Services Ribbon"
      className="relative w-full overflow-hidden select-none bg-[var(--warm-white)] border-y border-black/[0.06] py-3 sm:py-3.5 min-h-[46px] sm:min-h-[50px] flex items-center"
    >
      {/* Screen Reader Accessible Announcement */}
      <div className="sr-only">
        Core services offered by Laurrel Services: Cleaning, Moving, and Storage Solutions in Ottawa and surrounding areas.
      </div>

      {/* Decorative Scrolling Marquee Track */}
      <div
        className="ticker-track flex items-center w-max animate-ticker cursor-default"
        style={{
          animationDuration: '65s',
          animationPlayState: isTabVisible && !prefersReducedMotion ? 'running' : 'paused',
        }}
        aria-hidden="true"
      >
        {/* Track Set 1 */}
        <div className="flex items-center flex-shrink-0">
          {loopSequence.map((item, idx) => {
            const isEmphasis = item.id !== 'location' && !item.label.toLowerCase().includes('ottawa');
            return (
              <div
                key={`track1-${item.id}-${idx}`}
                className="inline-flex items-center flex-shrink-0"
              >
                <span
                  className={`text-[13px] sm:text-[14px] lg:text-[15px] tracking-tight ${
                    isEmphasis
                      ? 'font-semibold text-[#49056B]'
                      : 'font-medium text-[#202024]/75'
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className="inline-block w-px h-3 sm:h-3.5 bg-black/15 mx-4 sm:mx-6 flex-shrink-0"
                  aria-hidden="true"
                />
              </div>
            );
          })}
        </div>

        {/* Track Set 2 (Identical loop clone for seamless translateX(-50%)) */}
        <div className="flex items-center flex-shrink-0">
          {loopSequence.map((item, idx) => {
            const isEmphasis = item.id !== 'location' && !item.label.toLowerCase().includes('ottawa');
            return (
              <div
                key={`track2-${item.id}-${idx}`}
                className="inline-flex items-center flex-shrink-0"
              >
                <span
                  className={`text-[13px] sm:text-[14px] lg:text-[15px] tracking-tight ${
                    isEmphasis
                      ? 'font-semibold text-[#49056B]'
                      : 'font-medium text-[#202024]/75'
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className="inline-block w-px h-3 sm:h-3.5 bg-black/15 mx-4 sm:mx-6 flex-shrink-0"
                  aria-hidden="true"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
