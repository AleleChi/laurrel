'use client';

import React, { useState, useEffect } from 'react';
import { siteConfig } from '@/content/site';

export const ServiceTicker: React.FC = () => {
  const { items } = siteConfig.ticker;
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Repeat sequence 6 times per track for uninterrupted continuity across ultra-wide viewports
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
      className="relative w-full overflow-hidden select-none bg-[var(--warm-white)] border-y border-black/[0.05] py-4 sm:py-5 min-h-[64px] sm:min-h-[72px] flex items-center"
    >
      {/* Screen Reader Accessible Announcement */}
      <div className="sr-only">
        Core services offered by Laurrel Services: Cleaning, Moving, and Storage in Ottawa.
      </div>

      {/* Decorative Scrolling Marquee Track */}
      <div
        className="ticker-track flex items-center w-max animate-ticker cursor-default"
        style={{
          animationPlayState: isTabVisible ? 'running' : 'paused',
        }}
        aria-hidden="true"
      >
        {/* Track Set 1 */}
        <div className="flex items-center">
          {loopSequence.map((item, idx) => (
            <div
              key={`track1-${item.id}-${idx}`}
              className="px-6 sm:px-9 lg:px-12 flex-shrink-0"
            >
              <span className="text-[15px] sm:text-[17px] lg:text-[18px] font-medium tracking-tight text-[#202024]/85 hover:text-[#202024] transition-colors">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Track Set 2 (Identical loop clone for seamless translateX(-50%)) */}
        <div className="flex items-center">
          {loopSequence.map((item, idx) => (
            <div
              key={`track2-${item.id}-${idx}`}
              className="px-6 sm:px-9 lg:px-12 flex-shrink-0"
            >
              <span className="text-[15px] sm:text-[17px] lg:text-[18px] font-medium tracking-tight text-[#202024]/85 hover:text-[#202024] transition-colors">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
