/**
 * Global Motion Design System for Laurrel Services
 * Calibrated against Solshine About reference
 */

export const MOTION_EASE = [0.21, 0.47, 0.32, 0.98] as const;

export const MOTION_DURATIONS = {
  fast: 0.25,
  medium: 0.45,
  standard: 0.55,
  deliberate: 0.65,
  slow: 0.8,
} as const;

/**
 * Standard text entrance variants
 */
export const createTextVariants = (reducedMotion: boolean = false, distance: number = 18) => ({
  hidden: {
    opacity: 0,
    y: reducedMotion ? 0 : distance,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: reducedMotion ? 0.05 : MOTION_DURATIONS.standard,
      ease: MOTION_EASE,
    },
  },
});

/**
 * Standard container with stagger
 */
export const createStaggerContainer = (
  reducedMotion: boolean = false,
  staggerChildren: number = 0.1,
  delayChildren: number = 0.05
) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: reducedMotion ? 0 : staggerChildren,
      delayChildren: reducedMotion ? 0 : delayChildren,
    },
  },
});

/**
 * Standard image entrance variants
 */
export const createImageVariants = (reducedMotion: boolean = false, distance: number = 20) => ({
  hidden: {
    opacity: 0,
    y: reducedMotion ? 0 : distance,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: reducedMotion ? 0.05 : MOTION_DURATIONS.deliberate,
      ease: MOTION_EASE,
    },
  },
});

/**
 * Viewport configuration for robust multi-device triggering
 */
export const VIEWPORT_CONFIG = {
  once: true,
  amount: 0.05,
  margin: '0px 0px -40px 0px',
} as const;
