'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface IllustrationProps {
  className?: string;
  size?: number;
}

export const CleaningIllustration: React.FC<IllustrationProps> = ({
  className = 'w-24 h-24 lg:w-[104px] lg:h-[104px]',
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Animation variants
  const sprayVariants = {
    initial: { opacity: shouldReduceMotion ? 1 : 0, scale: shouldReduceMotion ? 1 : 0.6 },
    animate: {
      opacity: [0, 1, 0.8, 1],
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.9,
        delay: shouldReduceMotion ? 0 : 0.35,
        ease: 'easeOut',
      },
    },
    hover: {
      scale: [1, 1.15, 1],
      opacity: [1, 0.6, 1],
      transition: { duration: 0.5, repeat: 1 },
    },
  };

  const clothVariants = {
    initial: { x: shouldReduceMotion ? 0 : -6, opacity: shouldReduceMotion ? 1 : 0 },
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
      x: [0, 5, -3, 0],
      transition: { duration: 0.7, ease: 'easeInOut' },
    },
  };

  const triggerVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: shouldReduceMotion ? 0 : [0, -7, 0],
      transition: { duration: 0.6, delay: 0.4 },
    },
    hover: {
      rotate: [0, -9, 0],
      transition: { duration: 0.35 },
    },
  };

  const gleamVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5, delay: 0.6, ease: 'easeOut' },
    },
    hover: {
      scale: [1, 1.3, 1],
      opacity: [1, 0.7, 1],
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
      {/* 1. Ground / Countertop Polished Surface Line */}
      <line
        x1="8"
        y1="88"
        x2="92"
        y2="88"
        stroke="#18181B"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Surface Gleam / Polish Reflection */}
      <line
        x1="22"
        y1="93"
        x2="48"
        y2="93"
        stroke="#18181B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 4"
        opacity="0.6"
      />

      {/* 2. Spray Bottle Group */}
      <g>
        {/* Bottle Body Base & Contour */}
        <path
          d="M26 88 L26 58 C26 54 28 50 31 47 L35 43 L35 34 L45 34 L45 43 L49 47 C52 50 54 54 54 58 L54 88 Z"
          stroke="#18181B"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Liquid Measurement Level Markings */}
        <line x1="31" y1="64" x2="36" y2="64" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="31" y1="72" x2="38" y2="72" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="31" y1="80" x2="35" y2="80" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" />

        {/* Spray Head Pump Neck & Mechanism */}
        <path
          d="M33 34 L47 34 L47 26 C47 24 45 22 43 22 L37 22 C35 22 33 24 33 26 Z"
          stroke="#18181B"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Nozzle Horizontal Spout pointing right */}
        <path
          d="M45 23 L57 23 L57 28 L45 28 Z"
          stroke="#18181B"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Nozzle Tip */}
        <line x1="57" y1="24.5" x2="59" y2="24.5" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />

        {/* Spray Trigger Lever (Animated) */}
        <motion.path
          variants={triggerVariants}
          style={{ originX: '46px', originY: '28px' }}
          d="M47 29 C48 33 50 37 49 41 C48 43 46 44 45 44"
          stroke="#18181B"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* 3. Spray Droplets / Mist Particles (Animated) */}
      <motion.g variants={sprayVariants}>
        <circle cx="67" cy="23" r="1.5" fill="#18181B" />
        <circle cx="73" cy="19" r="1.2" fill="#18181B" />
        <circle cx="76" cy="26" r="1.8" fill="#18181B" />
        <path d="M63 20 L66 18" stroke="#18181B" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M64 26 L68 28" stroke="#18181B" strokeWidth="1.2" strokeLinecap="round" />
      </motion.g>

      {/* 4. Folded Cleaning Cloth (Animated) */}
      <motion.g variants={clothVariants}>
        {/* Folded Layer 1 */}
        <path
          d="M62 88 L62 68 C62 65 65 62 68 62 L84 62 C87 62 90 65 90 68 L90 88 Z"
          stroke="#18181B"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Folded Overhang Corner */}
        <path
          d="M68 62 L78 72 L88 62"
          stroke="#18181B"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Microfibre Weave Texture Hatch */}
        <line x1="68" y1="78" x2="84" y2="78" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
        <line x1="68" y1="83" x2="84" y2="83" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
      </motion.g>

      {/* 5. Clean Gleam / Star Accent */}
      <motion.g variants={gleamVariants}>
        <path
          d="M84 46 L86 40 L88 46 L94 48 L88 50 L86 56 L84 50 L78 48 Z"
          fill="#18181B"
        />
        <circle cx="73" cy="41" r="1" fill="#18181B" />
      </motion.g>
    </motion.svg>
  );
};
