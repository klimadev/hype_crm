'use client';

import { create } from 'zustand';
import { Variants, motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = { ...toast, id };
    set((state: ToastStore) => ({ toasts: [...state.toasts, newToast] }));

    if (toast.duration !== 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration || 5000);
    }

    return id;
  },
  removeToast: (id: string) => {
    set((state: ToastStore) => ({ toasts: state.toasts.filter((t: Toast) => t.id !== id) }));
  },
  updateToast: (id: string, updates: Partial<Toast>) => {
    set((state: ToastStore) => ({
      toasts: state.toasts.map((t: Toast) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },
}));

export function useToast() {
  const { addToast, removeToast, updateToast } = useToastStore();

  return {
    success: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'error', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'warning', title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'info', title, message, duration }),
    remove: removeToast,
    update: updateToast,
  };
}

const toastVariants: Variants = {
  initial: {
    opacity: 0,
    x: 400,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    x: 400,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
};

const typeStyles = {
  success: {
    icon: CheckCircle,
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    bgDark: 'bg-white dark:bg-zinc-900',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    titleColor: 'text-emerald-900 dark:text-emerald-100',
    messageColor: 'text-emerald-700 dark:text-emerald-300',
  },
  error: {
    icon: AlertCircle,
    bgLight: 'bg-red-50 dark:bg-red-950/30',
    bgDark: 'bg-white dark:bg-zinc-900',
    border: 'border-red-200 dark:border-red-800/50',
    iconColor: 'text-red-500 dark:text-red-400',
    titleColor: 'text-red-900 dark:text-red-100',
    messageColor: 'text-red-700 dark:text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    bgDark: 'bg-white dark:bg-zinc-900',
    border: 'border-amber-200 dark:border-amber-800/50',
    iconColor: 'text-amber-500 dark:text-amber-400',
    titleColor: 'text-amber-900 dark:text-amber-100',
    messageColor: 'text-amber-700 dark:text-amber-300',
  },
  info: {
    icon: Info,
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
    bgDark: 'bg-white dark:bg-zinc-900',
    border: 'border-blue-200 dark:border-blue-800/50',
    iconColor: 'text-blue-500 dark:text-blue-400',
    titleColor: 'text-blue-900 dark:text-blue-100',
    messageColor: 'text-blue-700 dark:text-blue-300',
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore();
  const styles = typeStyles[toast.type];
  const Icon = styles.icon;

  return (
    <motion.div
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`
        relative flex items-start gap-3 p-4 rounded-xl border shadow-lg
        ${styles.bgLight} ${styles.border}
        max-w-sm w-full pointer-events-auto
      `}
    >
      <div className={`flex-shrink-0 ${styles.iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${styles.titleColor}`}>
          {toast.title}
        </p>
        {toast.message && (
          <p className={`mt-1 text-sm ${styles.messageColor}`}>
            {toast.message}
          </p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className={`
              mt-2 text-sm font-medium underline
              ${styles.iconColor} hover:opacity-80
            `}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className={`
          flex-shrink-0 p-1 rounded-lg transition-colors
          hover:bg-black/5 dark:hover:bg-white/10
          ${styles.messageColor}
        `}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((state: ToastStore) => state.toasts);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast: Toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
