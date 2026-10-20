'use client';

import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface AboutMarqueeSectionProps {
  items?: string[];
}

export const AboutMarqueeSection: React.FC<AboutMarqueeSectionProps> = ({
  items = ['CLEANING', 'MOVING', 'STORAGE'],
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Pause animation when tab is not visible to conserve GPU / CPU resources
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Multiply items for smooth continuous loop
  const repeatedItems = [...items, ...items, ...items];

  return (
    <section
      aria-label="Core Laurrel Services marquee"
      className="w-full bg-[#000000] py-16 sm:py-20 lg:py-[82px] overflow-hidden select-none border-t border-b border-white/10 relative z-10"
    >
      <div
        className="flex w-max hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]"
        style={{
          // Calibrated against Solshine reference (~50px/sec smooth steady linear movement)
          animation: shouldReduceMotion
            ? 'none'
            : isTabVisible
            ? 'marqueeContinuous 85s linear infinite'
            : 'none',
          willChange: shouldReduceMotion ? 'auto' : 'transform',
        }}
      >
        {/* Track 1: Interactive primary content */}
        <div className="flex items-center shrink-0">
          {repeatedItems.map((item, idx) => (
            <React.Fragment key={`track-1-${idx}`}>
              <span
                className="text-5xl sm:text-7xl lg:text-[80px] font-bold uppercase tracking-tight transition-colors duration-300 hover:text-white/90"
                style={{
                  WebkitTextStroke: '1px rgba(255, 255, 255, 0.35)',
                  color: 'transparent',
                }}
              >
                {item}
              </span>
              {/* Lime geometric flower/sparkle separator icon (64px) */}
              <span className="mx-8 sm:mx-12 lg:mx-16 shrink-0 flex items-center justify-center">
                <svg
                  className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-[#FE6000] fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z" />
                </svg>
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Track 2: Identical twin duplicate for seamless infinite loop */}
        <div className="flex items-center shrink-0" aria-hidden="true">
          {repeatedItems.map((item, idx) => (
            <React.Fragment key={`track-2-${idx}`}>
              <span
                className="text-5xl sm:text-7xl lg:text-[80px] font-bold uppercase tracking-tight transition-colors duration-300 hover:text-white/90"
                style={{
                  WebkitTextStroke: '1px rgba(255, 255, 255, 0.35)',
                  color: 'transparent',
                }}
              >
                {item}
              </span>
              <span className="mx-8 sm:mx-12 lg:mx-16 shrink-0 flex items-center justify-center">
                <svg
                  className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-[#FE6000] fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z" />
                </svg>
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Global Hardware-Accelerated CSS Keyframes for Marquee */}
      <style jsx global>{`
        @keyframes marqueeContinuous {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
    </section>
  );
};
