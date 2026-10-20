import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'mark' | 'source-image' | 'lockup';
  priority?: boolean;
}

/**
 * Laurrel Services Official Brand Logo Component
 *
 * Renders the approved official brand identity featuring the architectural symbol,
 * LAURREL lettering, and SERVICES lettering with brand purple (#49056B) and orange (#FE6000).
 * Preserves exact natural aspect ratio, prevents layout shifts, and ensures optical header alignment.
 */
export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'default',
  priority = true,
}) => {
  if (variant === 'mark') {
    return (
      <div className={`relative flex items-center shrink-0 ${className}`}>
        <Image
          src="/assets/brand/laurrel-symbol.png"
          alt="Laurrel Services Symbol"
          width={40}
          height={40}
          className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
          priority={priority}
        />
      </div>
    );
  }

  // Primary horizontal wordmark logo
  return (
    <div className={`relative flex items-center shrink-0 select-none ${className}`}>
      <Image
        src="/assets/brand/laurrel-logo-primary.png"
        alt="Laurrel Services"
        width={180}
        height={59}
        className="h-9 sm:h-10 lg:h-[42px] w-auto max-w-[160px] sm:max-w-[175px] lg:max-w-[190px] object-contain"
        priority={priority}
      />
    </div>
  );
};
