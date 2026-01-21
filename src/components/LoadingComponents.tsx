'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap, Layers } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20"
        >
          <div className="relative w-full h-full">
            <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-700" />
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-violet-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border-4 border-transparent border-t-rose-500 border-b-amber-500"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>
        
        <motion.div
          className="absolute -top-2 -right-2"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <motion.p
          className="text-lg font-semibold text-zinc-900 dark:text-white"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Carregando quadro...
        </motion.p>
        <motion.p
          className="text-sm text-zinc-500 dark:text-zinc-400 mt-2"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        >
          Preparando seus dados
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 flex items-center gap-4"
      >
        <LoadingDots />
      </motion.div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 rounded-full bg-indigo-500"
          initial={{ scale: 0.5, opacity: 0.5 }}
          animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="skeleton-shimmer h-6 rounded-lg w-3/4" />
          <div className="skeleton-shimmer h-5 rounded-full w-20" />
        </div>
        <div className="skeleton-shimmer w-5 h-5 rounded" />
      </div>

      <div className="skeleton-shimmer h-20 rounded-xl" />

      <div className="flex items-center gap-4">
        <div className="skeleton-shimmer h-8 w-24 rounded-lg" />
        <div className="skeleton-shimmer h-8 w-20 rounded-lg ml-auto" />
      </div>
    </motion.div>
  );
}

export function SkeletonStage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="flex-shrink-0 w-80 rounded-2xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer w-3 h-3 rounded-full" />
          <div className="skeleton-shimmer h-5 w-24 rounded" />
          <div className="skeleton-shimmer w-8 h-5 rounded-full" />
        </div>
        <div className="skeleton-shimmer w-6 h-6 rounded" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="skeleton-shimmer h-10 rounded-lg" />
    </motion.div>
  );
}

export function SkeletonKanbanBoard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton-shimmer h-8 w-40 rounded" />
          <div className="skeleton-shimmer h-4 w-64 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton-shimmer w-28 h-10 rounded-xl" />
          <div className="skeleton-shimmer w-32 h-10 rounded-xl" />
        </div>
      </div>

      <div className="skeleton-shimmer h-12 rounded-xl w-full max-w-md" />

      <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 scrollbar-hide">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonStage key={i} />
        ))}
      </div>
    </div>
  );
}

export function MicroLoading({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { spinner: 'w-5 h-5', dot: 'w-1.5 h-1.5' },
    md: { spinner: 'w-8 h-8', dot: 'w-2.5 h-2.5' },
    lg: { spinner: 'w-12 h-12', dot: 'w-3.5 h-3.5' },
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizes[size].dot} rounded-full bg-indigo-500`}
          animate={{
            scale: [0.8, 1.3, 0.8],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function PhysicsSpinner() {
  return (
    <motion.div
      className="relative"
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    >
      <motion.div
        className="w-12 h-12 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-indigo-500 border-r-violet-500"
        animate={{ rotate: -360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-1"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <div className="w-full h-full rounded-full border-4 border-transparent border-t-rose-400 border-b-amber-400" />
      </motion.div>
    </motion.div>
  );
}

export function InlineLoading() {
  return (
    <span className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
      <motion.span
        className="inline-block w-2 h-2 rounded-full bg-indigo-500"
        animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <motion.span
        className="inline-block w-2 h-2 rounded-full bg-violet-500"
        animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
      />
      <motion.span
        className="inline-block w-2 h-2 rounded-full bg-rose-500"
        animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
      />
    </span>
  );
}

export function ButtonLoading() {
  return (
    <motion.div
      className="flex items-center justify-center"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </motion.div>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
    >
      {children}
    </motion.div>
  );
}

export function CardSpring({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        mass: 0.8,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  stagger = 0.1,
}: {
  children: React.ReactNode;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
