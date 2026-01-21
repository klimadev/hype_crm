import { Variants } from 'framer-motion';

export const premiumCardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  hover: {
    y: -4,
    scale: 1.02,
    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
};

export const buttonVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  hover: {
    scale: 1.02,
    y: -1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.96,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
};

export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: {
      duration: 0.2,
    },
  },
};

export const fadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
};

export const slideInRight: Variants = {
  initial: {
    opacity: 0,
    x: 100,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: {
      duration: 0.3,
    },
  },
};

export const slideInLeft: Variants = {
  initial: {
    opacity: 0,
    x: -100,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: {
      duration: 0.3,
    },
  },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

export const shimmerEffect = {
  initial: {
    x: '-100%',
  },
  animate: {
    x: '200%',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const pulseGlow: Variants = {
  initial: {
    boxShadow: '0 0 0 0px rgba(99, 102, 241, 0)',
  },
  animate: {
    boxShadow: [
      '0 0 0 0px rgba(99, 102, 241, 0)',
      '0 0 0 8px rgba(99, 102, 241, 0.2)',
      '0 0 0 0px rgba(99, 102, 241, 0)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const floatAnimation = {
  animate: {
    y: [-8, 8, -8],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const spinSlow = {
  animate: {
    rotate: 360,
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const bounceGentle = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const elasticScale: Variants = {
  initial: {
    opacity: 0,
    scale: 0.5,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
      mass: 0.8,
    },
  },
};

export const blurIn: Variants = {
  initial: {
    opacity: 0,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export const rippleEffect = {
  initial: {
    scale: 0,
    opacity: 0.5,
  },
  animate: {
    scale: 4,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

export const springTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

export const smoothTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
};

export const enterFromBottom: Variants = {
  initial: {
    opacity: 0,
    y: 50,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ...smoothTransition,
    },
  },
  exit: {
    opacity: 0,
    y: 50,
    transition: {
      duration: 0.2,
    },
  },
};

export const enterFromTop: Variants = {
  initial: {
    opacity: 0,
    y: -50,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ...smoothTransition,
    },
  },
  exit: {
    opacity: 0,
    y: -50,
    transition: {
      duration: 0.2,
    },
  },
};

export const enterFromRight: Variants = {
  initial: {
    opacity: 0,
    x: 50,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      ...smoothTransition,
    },
  },
  exit: {
    opacity: 0,
    x: 50,
    transition: {
      duration: 0.2,
    },
  },
};

export const enterFromLeft: Variants = {
  initial: {
    opacity: 0,
    x: -50,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      ...smoothTransition,
    },
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: {
      duration: 0.2,
    },
  },
};

export const scaleOnHover: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.95,
  },
};

export const liftOnHover: Variants = {
  initial: {
    y: 0,
  },
  hover: {
    y: -4,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    y: 0,
  },
};

export const glowOnHover: Variants = {
  initial: {
    boxShadow: '0 0 0 0px rgba(99, 102, 241, 0)',
  },
  hover: {
    boxShadow: '0 0 20px 0px rgba(99, 102, 241, 0.3)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
};

export const cardShine = {
  initial: {
    backgroundPosition: '200% center',
  },
  hover: {
    backgroundPosition: '-200% center',
    transition: {
      duration: 1,
    },
  },
};
