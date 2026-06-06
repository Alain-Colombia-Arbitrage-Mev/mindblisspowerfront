/**
 * Premium Animation System
 * Fade, soft slide, micro scale — 150-220ms timing
 */

export const ANIMATION_TIMING = {
  fast: 150,    // ms
  base: 180,    // ms
  slow: 220,    // ms
};

export const EASING = 'ease-out';

/**
 * Framer Motion animation presets
 */
export const ANIMATIONS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: {
      duration: ANIMATION_TIMING.base / 1000,
      ease: 'easeOut',
    },
  },

  fadeOut: {
    initial: { opacity: 1 },
    animate: { opacity: 0 },
    transition: {
      duration: ANIMATION_TIMING.fast / 1000,
      ease: 'easeOut',
    },
  },

  slideInUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: ANIMATION_TIMING.base / 1000,
      ease: 'easeOut',
    },
  },

  slideInDown: {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: ANIMATION_TIMING.base / 1000,
      ease: 'easeOut',
    },
  },

  slideInRight: {
    initial: { opacity: 0, x: 12 },
    animate: { opacity: 1, x: 0 },
    transition: {
      duration: ANIMATION_TIMING.slow / 1000,
      ease: 'easeOut',
    },
  },

  slideInLeft: {
    initial: { opacity: 0, x: -12 },
    animate: { opacity: 1, x: 0 },
    transition: {
      duration: ANIMATION_TIMING.slow / 1000,
      ease: 'easeOut',
    },
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      duration: ANIMATION_TIMING.slow / 1000,
      ease: 'easeOut',
    },
  },
};

/**
 * Container variants for staggered children
 */
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,    // 60ms between each child
      delayChildren: 0.04,      // 40ms before first child
    },
  },
};

/**
 * Child variants (cards, elements)
 */
export const childVariants = {
  hidden: {
    opacity: 0,
    y: 6,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_TIMING.base / 1000,
      ease: 'easeOut',
    },
  },
};