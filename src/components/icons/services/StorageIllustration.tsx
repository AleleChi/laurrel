'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface IllustrationProps {
  className?: string;
  size?: number;
}

export const StorageIllustration: React.FC<IllustrationProps> = ({
  className = 'w-24 h-24 lg:w-[104px] lg:h-[104px]',
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Animation variants
  const unitVariants = {
    initial: { opacity: shouldReduceMotion ? 1 : 0, scale: shouldReduceMotion ? 1 : 0.95 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.8,
        delay: shouldReduceMotion ? 0 : 0.15,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  const doorVariants = {
    initial: { y: shouldReduceMotion ? 0 : -8 },
    animate: {
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.9,
        delay: shouldReduceMotion ? 0 : 0.25,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
    hover: {
      y: -6,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const boxVariants = {
    initial: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 4 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.7,
        delay: shouldReduceMotion ? 0 : 0.35,
        ease: 'easeOut',
      },
    },
    hover: {
      y: [0, -1, 0],
      transition: { duration: 0.3 },
    },
  };

  const lockVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5, delay: 0.55 },
    },
    hover: {
      rotate: [0, -8, 8, 0],
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="initial"
      whileInView="animate"
      whileHover="hover"
      viewport={{ once: true, amount: 0.1 }}
      aria-hidden="true"
    >
      {/* 1. Ground / Concrete Apron Line */}
      <line
        x1="6"
        y1="88"
        x2="94"
        y2="88"
        stroke="#18181B"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Ground Ramp Shadow / Seams */}
      <line
        x1="22"
        y1="93"
        x2="78"
        y2="93"
        stroke="#18181B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 4"
        opacity="0.6"
      />

      {/* 2. Structural Storage Facility Frame */}
      <motion.g variants={unitVariants}>
        {/* Pitched Roofline / Overhang */}
        <path
          d="M10 26 L50 17 L90 26 L90 32 L10 32 Z"
          stroke="#18181B"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Roof Fascia Line */}
        <line x1="10" y1="32" x2="90" y2="32" stroke="#18181B" strokeWidth="2" />

        {/* Outer Left Pillar */}
        <path
          d="M14 32 L14 88 L22 88 L22 32"
          stroke="#18181B"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Outer Right Pillar */}
        <path
          d="M78 32 L78 88 L86 88 L86 32"
          stroke="#18181B"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Pillar Reinforcement Hatches */}
        <line x1="14" y1="50" x2="22" y2="50" stroke="#18181B" strokeWidth="1.4" />
        <line x1="14" y1="70" x2="22" y2="70" stroke="#18181B" strokeWidth="1.4" />
        <line x1="78" y1="50" x2="86" y2="50" stroke="#18181B" strokeWidth="1.4" />
        <line x1="78" y1="70" x2="86" y2="70" stroke="#18181B" strokeWidth="1.4" />

        {/* Storage Unit Identification Plaque */}
        <rect x="42" y="24" width="16" height="6" rx="1" stroke="#18181B" strokeWidth="1.4" fill="#FE6000" />
        <line x1="46" y1="27" x2="54" y2="27" stroke="#18181B" strokeWidth="1.2" strokeLinecap="round" />
      </motion.g>

      {/* 3. Interior Stored Belongings (Visible inside bay) */}
      <motion.g variants={boxVariants}>
        {/* Base Large Storage Box */}
        <rect
          x="26"
          y="66"
          width="24"
          height="22"
          stroke="#18181B"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Packaging Tape on Box 1 */}
        <line x1="26" y1="77" x2="50" y2="77" stroke="#18181B" strokeWidth="1.4" strokeDasharray="2 2" />
        <line x1="38" y1="66" x2="38" y2="88" stroke="#18181B" strokeWidth="1.4" />

        {/* Stacked Box 2 (Top Left) */}
        <rect
          x="30"
          y="50"
          width="18"
          height="16"
          stroke="#18181B"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <line x1="39" y1="50" x2="39" y2="66" stroke="#18181B" strokeWidth="1.4" />

        {/* Stored Wardrobe Box / Container (Right) */}
        <rect
          x="53"
          y="56"
          width="21"
          height="32"
          stroke="#18181B"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Handle / Tape for Wardrobe Box */}
        <rect x="60" y="62" width="7" height="3" rx="1.5" stroke="#18181B" strokeWidth="1.4" />
        <line x1="53" y1="74" x2="74" y2="74" stroke="#18181B" strokeWidth="1.2" strokeDasharray="3 3" />
      </motion.g>

      {/* 4. Architectural Roll-up Corrugated Shutter Door */}
      <motion.g variants={doorVariants}>
        {/* Shutter Coil Drum at Top */}
        <rect
          x="22"
          y="32"
          width="56"
          height="8"
          stroke="#18181B"
          strokeWidth="1.8"
          fill="#FE6000"
        />

        {/* Corrugated Slats */}
        <path
          d="M22 40 L78 40 M22 44 L78 44 M22 48 L78 48 M22 52 L78 52"
          stroke="#18181B"
          strokeWidth="1.8"
        />

        {/* Heavy Bottom Slat / T-Bar Rail */}
        <rect
          x="21"
          y="52"
          width="58"
          height="4.5"
          stroke="#18181B"
          strokeWidth="1.8"
          fill="#18181B"
        />

        {/* Security Padlock / Latch Assembly */}
        <motion.g variants={lockVariants} style={{ originX: '50px', originY: '57px' }}>
          {/* Padlock Shackle */}
          <path
            d="M47 54 C47 51 53 51 53 54"
            stroke="#18181B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Padlock Solid Body */}
          <rect
            x="45"
            y="54"
            width="10"
            height="8"
            rx="1.5"
            stroke="#18181B"
            strokeWidth="1.5"
            fill="#FE6000"
          />
          {/* Keyhole */}
          <circle cx="50" cy="57.5" r="1" fill="#18181B" />
          <line x1="50" y1="58.5" x2="50" y2="60.5" stroke="#18181B" strokeWidth="1" strokeLinecap="round" />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
};
