export const motionTokens = {
  spring: { type: 'spring', stiffness: 220, damping: 26 },
  ease: [0.22, 1, 0.36, 1],
  fast: 0.18,
  normal: 0.28
};

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

export const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
};
