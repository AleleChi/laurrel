import React from 'react';
import { Sparkles, Truck, Package } from 'lucide-react';
import { siteConfig } from '@/content/site';

export const ServiceTicker: React.FC = () => {
  const { items } = siteConfig.ticker;

  // Icon mapping helper
  const renderIcon = (name: string) => {
    switch (name) {
      case 'sparkles':
        return <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#557A00]" />;
      case 'truck':
        return <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-[#390044]" />;
      case 'box':
        return <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#557A00]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#557A00]" />;
    }
  };

  // Duplicate items 4 times to ensure seamless infinite looping on ultra-wide screens
  const tickerItems = [...items, ...items, ...items, ...items];

  return (
    <section
      aria-label="Service Offerings Ribbon"
      className="relative w-full py-2.5 sm:py-3.5 bg-[#F2F7D9] border-y border-[#C8E80B]/50 overflow-hidden select-none"
    >
      {/* Screen Reader Accessible Announcement */}
      <div className="sr-only">
        Core services provided by Laurrel Services in Ottawa: Cleaning, Moving, and Storage.
      </div>

      {/* Decorative Scrolling Marquee Track */}
      <div
        className="ticker-track flex items-center w-max animate-ticker cursor-default"
        aria-hidden="true"
      >
        {/* Set 1 */}
        <div className="flex items-center">
          {tickerItems.map((item, idx) => (
            <div key={`set1-${item.id}-${idx}`} className="flex items-center">
              <div className="flex items-center gap-2.5 sm:gap-3 px-6 sm:px-10 py-1">
                {renderIcon(item.iconName)}
                <span className="text-sm sm:text-base font-bold tracking-wide text-[#390044]">
                  {item.label}
                </span>
              </div>
              {/* Vertical Hairline Separator */}
              <div className="h-4 sm:h-5 w-[1px] bg-[#390044]/20 flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* Set 2 (Identical duplicate for seamless CSS translateX(-50%) loop) */}
        <div className="flex items-center">
          {tickerItems.map((item, idx) => (
            <div key={`set2-${item.id}-${idx}`} className="flex items-center">
              <div className="flex items-center gap-2.5 sm:gap-3 px-6 sm:px-10 py-1">
                {renderIcon(item.iconName)}
                <span className="text-sm sm:text-base font-bold tracking-wide text-[#390044]">
                  {item.label}
                </span>
              </div>
              {/* Vertical Hairline Separator */}
              <div className="h-4 sm:h-5 w-[1px] bg-[#390044]/20 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
