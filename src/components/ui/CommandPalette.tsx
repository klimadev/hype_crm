'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Search,
  ArrowRight,
  Plus,
  LayoutDashboard,
  Users,
  Tag,
  Settings,
  Bell,
  QrCode,
  ChevronRight,
  X,
  Keyboard,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommandAction {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  children?: React.ReactNode;
}

const modalVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

const backdropVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

const listVariants: Variants = {
  initial: {
    opacity: 0,
    y: -10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.15,
    },
  },
};

const categories = [
  { id: 'navigation', label: 'Navegação', icon: LayoutDashboard },
  { id: 'create', label: 'Criar Novo', icon: Plus },
  { id: 'actions', label: 'Ações Rápidas', icon: Bell },
  { id: 'system', label: 'Sistema', icon: Settings },
];

export function CommandPalette({ children }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const actions: CommandAction[] = [
    {
      id: 'dashboard',
      label: 'Ir para Dashboard',
      shortcut: 'G then D',
      icon: <LayoutDashboard className="w-4 h-4" />,
      category: 'navigation',
      action: () => router.push('/'),
    },
    {
      id: 'kanban',
      label: 'Ir para Kanban',
      shortcut: 'G then K',
      icon: <Users className="w-4 h-4" />,
      category: 'navigation',
      action: () => router.push('/kanban'),
    },
    {
      id: 'products',
      label: 'Ir para Produtos',
      shortcut: 'G then P',
      icon: <Tag className="w-4 h-4" />,
      category: 'navigation',
      action: () => router.push('/products'),
    },
    {
      id: 'instances',
      label: 'Gerenciar Instâncias',
      shortcut: 'G then I',
      icon: <QrCode className="w-4 h-4" />,
      category: 'navigation',
      action: () => router.push('/instances'),
    },
    {
      id: 'stages',
      label: 'Gerenciar Estágios',
      shortcut: 'G then S',
      icon: <Settings className="w-4 h-4" />,
      category: 'navigation',
      action: () => router.push('/kanban/stages'),
    },
    {
      id: 'new-lead',
      label: 'Criar Novo Lead',
      shortcut: 'C then L',
      icon: <Plus className="w-4 h-4" />,
      category: 'create',
      action: () => router.push('/kanban/leads/new'),
    },
    {
      id: 'new-product',
      label: 'Criar Novo Produto',
      shortcut: 'C then P',
      icon: <Plus className="w-4 h-4" />,
      category: 'create',
      action: () => router.push('/products/new'),
    },
    {
      id: 'search-lead',
      label: 'Buscar Leads',
      shortcut: '/',
      icon: <Search className="w-4 h-4" />,
      category: 'actions',
      action: () => router.push('/kanban'),
    },
    {
      id: 'refresh-data',
      label: 'Atualizar Dados',
      shortcut: 'R',
      icon: <Bell className="w-4 h-4" />,
      category: 'actions',
      action: () => window.location.reload(),
    },
  ];

  const filteredActions = actions.filter((action) => {
    const searchQuery = query.toLowerCase();
    return (
      action.label.toLowerCase().includes(searchQuery) ||
      action.category.toLowerCase().includes(searchQuery) ||
      action.shortcut?.toLowerCase().includes(searchQuery)
    );
  });

  const groupedActions = categories
    .map((category) => ({
      ...category,
      items: filteredActions.filter((action) => action.category === category.id),
    }))
    .filter((category) => category.items.length > 0);

  const totalItems = groupedActions.reduce((acc, cat) => acc + cat.items.length, 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query !== '') {
      const timer = setTimeout(() => {
        setSelectedIndex(0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (totalItems > 0) {
          const allItems = groupedActions.flatMap((cat) => cat.items);
          allItems[selectedIndex]?.action();
          setIsOpen(false);
          setQuery('');
        }
      }
    },
    [groupedActions, selectedIndex, totalItems]
  );

  const handleAction = useCallback((action: CommandAction) => {
    action.action();
    setIsOpen(false);
    setQuery('');
  }, []);

  return (
    <>
      {children}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              variants={backdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl z-[9999]"
            >
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-100 dark:border-zinc-800">
                  <Search className="w-5 h-5 text-zinc-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Buscar ações, navegação..."
                    className="flex-1 bg-transparent text-lg outline-none placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                  />
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                      ESC
                    </kbd>
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {groupedActions.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500">
                      <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p>Nenhum resultado encontrado</p>
                    </div>
                  ) : (
                    groupedActions.map((category) => (
                      <div key={category.id} className="py-2">
                        <div className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          {category.label}
                        </div>
                        {category.items.map((action, index) => {
                          const absoluteIndex = groupedActions
                            .slice(0, groupedActions.indexOf(category))
                            .reduce((acc, cat) => acc + cat.items.length, 0) + index;

                          return (
                            <motion.button
                              key={action.id}
                              variants={listVariants}
                              initial="initial"
                              animate="animate"
                              className={`
                                w-full flex items-center gap-3 px-4 py-3 text-left
                                transition-colors
                                ${
                                  absoluteIndex === selectedIndex
                                    ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                                }
                              `}
                              onClick={() => handleAction(action)}
                              onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                            >
                              <div
                                className={`
                                  flex-shrink-0
                                  ${
                                    absoluteIndex === selectedIndex
                                      ? 'text-indigo-500'
                                      : 'text-zinc-400'
                                  }
                                `}
                              >
                                {action.icon}
                              </div>
                              <span className="flex-1 font-medium">{action.label}</span>
                              {action.shortcut && (
                                <kbd className="px-2 py-1 text-xs font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded">
                                  {action.shortcut}
                                </kbd>
                              )}
                              <ChevronRight
                                className={`w-4 h-4 ${
                                  absoluteIndex === selectedIndex
                                    ? 'text-indigo-400'
                                    : 'text-zinc-300 dark:text-zinc-600'
                                }`}
                              />
                            </motion.button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Keyboard className="w-3 h-3" />
                      Navegar
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      Selecionar
                    </span>
                  </div>
                  <button
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Ver atalhos
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000]"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Atalhos de Teclado
                </h3>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { keys: '⌘ K', action: 'Abrir paleta de comandos' },
                  { keys: '⌘ D', action: 'Ir para Dashboard' },
                  { keys: '⌘ K', action: 'Ir para Kanban' },
                  { keys: 'C L', action: 'Criar Lead' },
                  { keys: 'C P', action: 'Criar Produto' },
                  { keys: 'ESC', action: 'Fechar' },
                ].map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {shortcut.action}
                    </span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
