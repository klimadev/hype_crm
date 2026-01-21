'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  MoreHorizontal,
  Plus,
  Trash2,
  Edit,
  Copy,
  Archive,
  Mail,
  MessageSquare,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  action: () => void;
  shortcut?: string;
  submenu?: QuickAction[];
}

export type { QuickAction };

interface QuickActionsMenuProps {
  actions: QuickAction[];
  children?: React.ReactNode;
  align?: 'left' | 'right';
}

interface SubmenuProps {
  action: QuickAction;
  isOpen: boolean;
  onClose: () => void;
}

function Submenu({ action, isOpen, onClose }: SubmenuProps) {
  return (
    <AnimatePresence>
      {isOpen && action.submenu && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="absolute left-full top-0 ml-1 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-800 py-2 min-w-[180px] z-50"
          onMouseLeave={onClose}
        >
          {action.submenu.map((subAction) => (
            <button
              key={subAction.id}
              onClick={() => {
                subAction.action();
                onClose();
              }}
              disabled={subAction.disabled}
              className={`
                w-full flex items-center gap-2 px-4 py-2 text-sm
                ${
                  subAction.danger
                    ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }
                ${subAction.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className="text-zinc-400">{subAction.icon}</span>
              <span className="flex-1 text-left">{subAction.label}</span>
              {subAction.shortcut && (
                <kbd className="px-1.5 py-0.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded">
                  {subAction.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const menuVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: -10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: 0.15,
    },
  },
};

export function QuickActionsMenu({ actions, children, align = 'right' }: QuickActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false);
      setOpenSubmenuId(null);
    }
  }, []);

  const handleAction = useCallback((action: QuickAction) => {
    if (action.submenu) {
      setOpenSubmenuId(openSubmenuId === action.id ? null : action.id);
    } else {
      action.action();
      setIsOpen(false);
    }
  }, [openSubmenuId]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-xl
          bg-zinc-100 dark:bg-zinc-800
          text-zinc-700 dark:text-zinc-300
          hover:bg-zinc-200 dark:hover:bg-zinc-700
          transition-colors
        `}
      >
        {children || <MoreHorizontal className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              ref={menuRef}
              variants={menuVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`
                absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'}
                bg-white dark:bg-zinc-900 rounded-xl shadow-xl
                border border-zinc-100 dark:border-zinc-800
                py-2 min-w-[200px] z-50
                overflow-hidden
              `}
            >
              {actions.map((action, index) => (
                <div key={action.id} className="relative">
                  <button
                    onClick={() => handleAction(action)}
                    disabled={action.disabled}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-sm
                      ${
                        action.danger
                          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }
                      ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onMouseEnter={() => {
                      if (action.submenu) {
                        setOpenSubmenuId(action.id);
                      }
                    }}
                  >
                    <span className="text-zinc-400">{action.icon}</span>
                    <span className="flex-1 text-left">{action.label}</span>
                    {action.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded">
                        {action.shortcut}
                      </kbd>
                    )}
                    {action.submenu && (
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                  {action.submenu && (
                    <Submenu
                      action={action}
                      isOpen={openSubmenuId === action.id}
                      onClose={() => setOpenSubmenuId(null)}
                    />
                  )}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FloatingQuickActionsProps {
  onAddLead?: () => void;
  onAddProduct?: () => void;
  onSearch?: () => void;
}

export function FloatingQuickActions({
  onAddLead,
  onAddProduct,
  onSearch,
}: FloatingQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions: QuickAction[] = [
    {
      id: 'add-lead',
      label: 'Novo Lead',
      icon: <Plus className="w-4 h-4" />,
      action: () => onAddLead?.(),
      shortcut: 'C+L',
    },
    {
      id: 'add-product',
      label: 'Novo Produto',
      icon: <Target className="w-4 h-4" />,
      action: () => onAddProduct?.(),
      shortcut: 'C+P',
    },
    {
      id: 'search',
      label: 'Buscar',
      icon: <Search className="w-4 h-4" />,
      action: () => onSearch?.(),
      shortcut: '/',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 right-0 flex flex-col-reverse gap-2"
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  action.action();
                  setIsExpanded(false);
                }}
                className={`
                  flex items-center gap-3 px-4 py-3
                  bg-white dark:bg-zinc-900
                  rounded-xl shadow-lg
                  border border-zinc-100 dark:border-zinc-800
                  text-zinc-700 dark:text-zinc-300
                  hover:shadow-xl transition-shadow
                `}
              >
                <span className="text-indigo-600 dark:text-indigo-400">
                  {action.icon}
                </span>
                <span className="font-medium">{action.label}</span>
                {action.shortcut && (
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded">
                    {action.shortcut}
                  </kbd>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center justify-center gap-2
          w-14 h-14 rounded-full
          bg-indigo-600 hover:bg-indigo-700
          text-white shadow-lg
          transition-colors
        `}
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <Sparkles className="w-6 h-6" />
        )}
      </motion.button>
    </div>
  );
}

import { Search, X, Target } from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: QuickAction[];
  isVisible: boolean;
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  actions,
  isVisible,
}: BulkActionsToolbarProps) {
  return (
    <AnimatePresence>
      {isVisible && selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {selectedCount}
                </span>
              </div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                selecionados
              </span>
            </div>

            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />

            <div className="flex items-center gap-2">
              {actions.slice(0, 3).map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                    ${
                      action.danger
                        ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }
                  `}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}

              {actions.length > 3 && (
                <QuickActionsMenu
                  actions={actions.slice(3)}
                  align="left"
                />
              )}
            </div>

            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />

            <button
              onClick={onClearSelection}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
              <span>Limpar</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
