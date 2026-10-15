'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface IllustrationProps {
  className?: string;
  size?: number;
}

export const MovingIllustration: React.FC<IllustrationProps> = ({
  className = 'w-24 h-24 lg:w-[104px] lg:h-[104px]',
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Animation variants
  const truckVariants = {
    initial: { x: shouldReduceMotion ? 0 : -8, opacity: shouldReduceMotion ? 1 : 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.8,
        delay: shouldReduceMotion ? 0 : 0.2,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
    hover: {
      x: [0, 4, 0],
      y: [0, -1.5, 0],
      transition: { duration: 0.6, ease: 'easeInOut' },
    },
  };

  const wheelVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: shouldReduceMotion ? 0 : [0, 360],
      transition: { duration: shouldReduceMotion ? 0.05 : 0.8, delay: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' },
    },
    hover: {
      rotate: 360,
      transition: { duration: 0.8, ease: 'linear' },
    },
  };

  const trailVariants = {
    initial: { opacity: 0, x: 4 },
    animate: {
      opacity: [0, 0.9, 0.5, 0.8],
      x: 0,
      transition: { duration: 0.6, delay: 0.4, ease: 'easeOut' },
    },
    hover: {
      opacity: [0.4, 1, 0.4],
      x: [-2, -6, -2],
      transition: { duration: 0.5, repeat: 1 },
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
      {/* 1. Road / Ground Line */}
      <line
        x1="6"
        y1="88"
        x2="94"
        y2="88"
        stroke="#18181B"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Road Dashes beneath */}
      <line
        x1="24"
        y1="93"
        x2="48"
        y2="93"
        stroke="#18181B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 4"
        opacity="0.6"
      />

      {/* 2. Motion / Velocity Trails behind truck */}
      <motion.g variants={trailVariants}>
        <line x1="4" y1="70" x2="11" y2="70" stroke="#18181B" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="2" y1="76" x2="9" y2="76" stroke="#18181B" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="5" y1="82" x2="13" y2="82" stroke="#18181B" strokeWidth="1.8" strokeLinecap="round" />
      </motion.g>

      {/* 3. Truck Assembly (Chassis + Cargo Box + Cab) */}
      <motion.g variants={truckVariants}>
        {/* Cargo Box Contour */}
        <path
          d="M14 80 L14 34 C14 31 16 29 19 29 L64 29 L64 80 Z"
          stroke="#18181B"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Cargo Box Interior Ribs / Reinforcement Panels */}
        <line x1="31" y1="29" x2="31" y2="80" stroke="#18181B" strokeWidth="1.5" />
        <line x1="48" y1="29" x2="48" y2="80" stroke="#18181B" strokeWidth="1.5" />

        {/* Cargo Box Corner Caps / Corner Protectors */}
        <path d="M14 38 L20 38 L20 29" stroke="#18181B" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M58 29 L58 38 L64 38" stroke="#18181B" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Cargo Tie-Down / Protection Rail */}
        <line x1="14" y1="46" x2="64" y2="46" stroke="#18181B" strokeWidth="1.4" strokeDasharray="3 3" opacity="0.7" />

        {/* Rear Door Handle Latch Bar */}
        <line x1="17" y1="52" x2="17" y2="68" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
        <rect x="16" y="58" width="5" height="3" fill="#18181B" rx="1" />

        {/* Cab Outline */}
        <path
          d="M64 45 L76 45 L85 58 L92 61 L92 80 L88 80"
          stroke="#18181B"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Cab Windshield & Side Window */}
        <path
          d="M69 49 L76 49 L83 58 L69 58 Z"
          stroke="#18181B"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Side Mirror */}
        <line x1="77" y1="52" x2="81" y2="52" stroke="#18181B" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="81" y1="50" x2="81" y2="56" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />

        {/* Door Handle */}
        <line x1="72" y1="64" x2="77" y2="64" stroke="#18181B" strokeWidth="1.8" strokeLinecap="round" />

        {/* Front Grille / Bumper */}
        <path d="M88 74 L93 74 L93 80 L88 80" stroke="#18181B" strokeWidth="2" strokeLinejoin="round" />
        {/* Headlight */}
        <rect x="88" y="63" width="4" height="4" rx="1" fill="#18181B" />

        {/* Undercarriage Battery / Toolbox Box */}
        <rect x="44" y="80" width="16" height="5" stroke="#18181B" strokeWidth="1.6" />

        {/* Wheel Cutouts in Chassis */}
        {/* Rear Wheel Arch */}
        <path
          d="M20 80 C20 73 36 73 36 80"
          stroke="#18181B"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Front Wheel Arch */}
        <path
          d="M68 80 C68 73 84 73 84 80"
          stroke="#18181B"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </motion.g>

      {/* 4. Rear Wheel Assembly */}
      <motion.g
        variants={wheelVariants}
        style={{ originX: '28px', originY: '80px' }}
      >
        <circle cx="28" cy="80" r="7.5" stroke="#18181B" strokeWidth="2" fill="#C8E80B" />
        <circle cx="28" cy="80" r="3.5" stroke="#18181B" strokeWidth="1.8" fill="#18181B" />
        <line x1="28" y1="73.5" x2="28" y2="86.5" stroke="#18181B" strokeWidth="1.4" />
        <line x1="21.5" y1="80" x2="34.5" y2="80" stroke="#18181B" strokeWidth="1.4" />
      </motion.g>

      {/* 5. Front Wheel Assembly */}
      <motion.g
        variants={wheelVariants}
        style={{ originX: '76px', originY: '80px' }}
      >
        <circle cx="76" cy="80" r="7.5" stroke="#18181B" strokeWidth="2" fill="#C8E80B" />
        <circle cx="76" cy="80" r="3.5" stroke="#18181B" strokeWidth="1.8" fill="#18181B" />
        <line x1="76" y1="73.5" x2="76" y2="86.5" stroke="#18181B" strokeWidth="1.4" />
        <line x1="69.5" y1="80" x2="82.5" y2="80" stroke="#18181B" strokeWidth="1.4" />
      </motion.g>
    </motion.svg>
  );
};
