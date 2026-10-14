import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'lockup' | 'source-image';
}

/**
 * Laurrel Services Brand Logo
 * 
 * Provides a crisp, retina-ready horizontal lockup faithfully replicating
 * the brand's house mark (Cleaning broom, Moving truck, Storage unit) and
 * typography. Also supports displaying the source raster asset.
 */
export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'lockup' }) => {
  if (variant === 'source-image') {
    return (
      <div className={`relative flex items-center ${className}`}>
        <Image
          src="/assets/brand/laurrel-logo-source.png"
          alt="Laurrel Services Logo"
          width={180}
          height={60}
          className="h-10 w-auto object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon: House enclosing the 3 service chambers */}
      <svg
        className="w-10 h-10 flex-shrink-0"
        viewBox="0 0 100 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Main Outer Roof Structure (Purple) */}
        <path
          d="M50 4L8 38H22V76H78V38H92L50 4Z"
          fill="#390044"
        />
        {/* Lime Accent Gable Stripe */}
        <path
          d="M50 4L82 30L78 34L50 10L22 34L18 30L50 4Z"
          fill="#C8E80B"
        />

        {/* Top Window / Attic Accent (Lime) */}
        <rect x="42" y="20" width="7" height="7" rx="1" fill="#C8E80B" />
        <rect x="51" y="20" width="7" height="7" rx="1" fill="#C8E80B" />
        <rect x="42" y="29" width="7" height="7" rx="1" fill="#C8E80B" />
        <rect x="51" y="29" width="7" height="7" rx="1" fill="#C8E80B" />

        {/* Left Chamber: Cleaning (Broom & Sparkles) */}
        <g transform="translate(18, 42)">
          {/* Broom stick & head */}
          <line x1="20" y1="2" x2="6" y2="24" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M4 22L12 28L2 30Z" fill="#C8E80B" />
          {/* Sparkles */}
          <polygon points="6,6 7,9 10,10 7,11 6,14 5,11 2,10 5,9" fill="#C8E80B" />
          <polygon points="16,14 17,16 19,17 17,18 16,20 15,18 13,17 15,16" fill="#C8E80B" />
        </g>

        {/* Center Chamber: Moving (Green container with Delivery Truck) */}
        <rect x="36" y="42" width="28" height="30" rx="1" fill="#C8E80B" />
        <g transform="translate(38, 48)">
          {/* Speed lines */}
          <line x1="1" y1="6" x2="5" y2="6" stroke="#390044" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="10" x2="6" y2="10" stroke="#390044" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2" y1="14" x2="5" y2="14" stroke="#390044" strokeWidth="1.5" strokeLinecap="round" />
          {/* Truck Body */}
          <rect x="7" y="3" width="11" height="11" rx="1" fill="#390044" />
          <path d="M18 7H21L23 10V14H18V7Z" fill="#390044" />
          {/* Wheels */}
          <circle cx="10" cy="15" r="2" fill="#FFFFFF" stroke="#390044" strokeWidth="1" />
          <circle cx="20" cy="15" r="2" fill="#FFFFFF" stroke="#390044" strokeWidth="1" />
        </g>

        {/* Right Chamber: Storage (Roll-up garage door & stacked boxes) */}
        <g transform="translate(68, 42)">
          {/* Arch / Roll-up lines */}
          <rect x="0" y="0" width="24" height="30" rx="1" fill="#27002E" />
          <line x1="3" y1="4" x2="21" y2="4" stroke="#4E025D" strokeWidth="1" />
          <line x1="3" y1="7" x2="21" y2="7" stroke="#4E025D" strokeWidth="1" />
          {/* Stacked Storage boxes */}
          <rect x="7" y="10" width="10" height="8" rx="0.5" fill="#C8E80B" />
          <circle cx="12" cy="14" r="1" fill="#390044" />
          <rect x="2" y="19" width="9" height="9" rx="0.5" fill="#C8E80B" />
          <circle cx="6.5" cy="23.5" r="1" fill="#390044" />
          <rect x="13" y="19" width="9" height="9" rx="0.5" fill="#C8E80B" />
          <circle cx="17.5" cy="23.5" r="1" fill="#390044" />
        </g>
      </svg>

      {/* Typography: LAURREL SERVICES */}
      <div className="flex flex-col justify-center leading-none">
        <span className="font-extrabold tracking-tight text-[1.4rem] text-[#390044] font-sans">
          LAURREL
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="h-[1.5px] w-3 bg-[#557A00] rounded-full opacity-60"></span>
          <span className="font-bold tracking-widest text-[0.68rem] text-[#557A00] uppercase font-sans">
            SERVICES
          </span>
          <span className="h-[1.5px] w-3 bg-[#557A00] rounded-full opacity-60"></span>
        </div>
      </div>
    </div>
  );
};
