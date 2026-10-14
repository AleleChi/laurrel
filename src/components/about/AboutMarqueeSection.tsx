'use client';

import React from 'react';

interface AboutMarqueeSectionProps {
  items?: string[];
}

export const AboutMarqueeSection: React.FC<AboutMarqueeSectionProps> = ({
  items = ['CLEANING', 'MOVING', 'STORAGE'],
}) => {
  // Multiply items to ensure wide continuous coverage
  const repeatedItems = [...items, ...items, ...items];

  return (
    <section
      aria-label="Core Laurrel Services marquee"
      className="w-full bg-[#0B0B0E] py-8 sm:py-12 lg:py-14 overflow-hidden border-t border-b border-white/5 select-none"
    >
      <div className="flex w-max animate-ticker hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
        {/* Track 1 */}
        <div className="flex items-center shrink-0">
          {repeatedItems.map((item, idx) => (
            <React.Fragment key={`track-1-${idx}`}>
              <span
                className="text-5xl sm:text-7xl lg:text-[88px] xl:text-[96px] font-black uppercase tracking-tight transition-colors duration-300 hover:text-white/90"
                style={{
                  WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.4)',
                  color: 'transparent',
                }}
              >
                {item}
              </span>
              {/* Lime geometric separator icon */}
              <span className="mx-6 sm:mx-10 lg:mx-12 shrink-0 flex items-center justify-center">
                <svg
                  className="w-5 h-5 sm:w-7 sm:h-7 text-[#C8E80B] fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 4.5l5 5V18h-3v-5H10v5H7v-6.5l5-5z" />
                </svg>
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Track 2 (Duplicate for seamless loop) */}
        <div className="flex items-center shrink-0" aria-hidden="true">
          {repeatedItems.map((item, idx) => (
            <React.Fragment key={`track-2-${idx}`}>
              <span
                className="text-5xl sm:text-7xl lg:text-[88px] xl:text-[96px] font-black uppercase tracking-tight transition-colors duration-300 hover:text-white/90"
                style={{
                  WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.4)',
                  color: 'transparent',
                }}
              >
                {item}
              </span>
              <span className="mx-6 sm:mx-10 lg:mx-12 shrink-0 flex items-center justify-center">
                <svg
                  className="w-5 h-5 sm:w-7 sm:h-7 text-[#C8E80B] fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 4.5l5 5V18h-3v-5H10v5H7v-6.5l5-5z" />
                </svg>
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};
