'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useToast } from './Toast';

export type ShortcutAction = {
  id: string;
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: string;
  callback: () => void;
  preventDefault?: boolean;
};

interface KeyboardShortcutsProps {
  shortcuts: ShortcutAction[];
  enabled?: boolean;
}

export function KeyboardShortcuts({ shortcuts, enabled = true }: KeyboardShortcutsProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { success, warning } = useToast();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey && !e.metaKey;
        const metaMatch = shortcut.meta ? e.metaKey : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            try {
              shortcut.callback();
            } catch (error) {
              console.error('Shortcut action failed:', error);
            }
          }, 10);

          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [shortcuts, enabled]);

  return null;
}

export function useKeyboardShortcuts(shortcuts: ShortcutAction[], enabled = true) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey && !e.metaKey;
        const metaMatch = shortcut.meta ? e.metaKey : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            try {
              shortcut.callback();
            } catch (error) {
              console.error('Shortcut action failed:', error);
            }
          }, 10);

          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [shortcuts, enabled]);
}

export function formatShortcut(shortcut: ShortcutAction): string {
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push('⇧');
  }
  if (shortcut.alt) {
    parts.push('⌥');
  }
  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
}

export function getShortcutDescription(shortcut: ShortcutAction): string {
  return `${shortcut.description} (${formatShortcut(shortcut)})`;
}

export const defaultShortcuts: ShortcutAction[] = [
  {
    id: 'command-palette',
    key: 'k',
    ctrl: true,
    description: 'Abrir paleta de comandos',
    category: 'navigation',
    callback: () => {
      const event = new CustomEvent('toggle-command-palette');
      window.dispatchEvent(event);
    },
  },
  {
    id: 'search',
    key: '/',
    shift: true,
    description: 'Buscar',
    category: 'navigation',
    callback: () => {
      const event = new CustomEvent('toggle-search');
      window.dispatchEvent(event);
    },
  },
  {
    id: 'new-lead',
    key: 'l',
    ctrl: true,
    shift: true,
    description: 'Criar novo lead',
    category: 'create',
    callback: () => {
      window.location.href = '/kanban/leads/new';
    },
  },
  {
    id: 'new-product',
    key: 'p',
    ctrl: true,
    shift: true,
    description: 'Criar novo produto',
    category: 'create',
    callback: () => {
      window.location.href = '/products/new';
    },
  },
  {
    id: 'refresh',
    key: 'r',
    ctrl: true,
    description: 'Atualizar página',
    category: 'actions',
    callback: () => {
      window.location.reload();
    },
  },
  {
    id: 'save',
    key: 's',
    ctrl: true,
    description: 'Salvar',
    category: 'actions',
    callback: () => {
      const event = new CustomEvent('trigger-save');
      window.dispatchEvent(event);
    },
  },
  {
    id: 'cancel',
    key: 'Escape',
    description: 'Cancelar / Fechar',
    category: 'actions',
    callback: () => {
      const event = new CustomEvent('trigger-cancel');
      window.dispatchEvent(event);
    },
  },
  {
    id: 'go-dashboard',
    key: 'd',
    ctrl: true,
    shift: true,
    description: 'Ir para Dashboard',
    category: 'navigation',
    callback: () => {
      window.location.href = '/';
    },
  },
  {
    id: 'go-kanban',
    key: 'k',
    ctrl: true,
    shift: true,
    description: 'Ir para Kanban',
    category: 'navigation',
    callback: () => {
      window.location.href = '/kanban';
    },
  },
  {
    id: 'go-products',
    key: 'p',
    ctrl: true,
    description: 'Ir para Produtos',
    category: 'navigation',
    callback: () => {
      window.location.href = '/products';
    },
  },
  {
    id: 'go-instances',
    key: 'i',
    ctrl: true,
    shift: true,
    description: 'Ir para Instâncias',
    category: 'navigation',
    callback: () => {
      window.location.href = '/instances';
    },
  },
];

export function ShortcutsHelpModal({
  isOpen,
  onClose,
  shortcuts = defaultShortcuts,
}: {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: ShortcutAction[];
}) {
  const categories = [...new Set(shortcuts.map((s) => s.category))];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Atalhos de Teclado
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg
              className="w-5 h-5 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {categories.map((category) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {shortcut.description}
                      </span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <p className="text-xs text-center text-zinc-500">
            Pressione <kbd className="px-1.5 py-0.5 text-xs font-mono bg-zinc-200 dark:bg-zinc-700 rounded">?</kbd> para
            mostrar esta ajuda
          </p>
        </div>
      </div>
    </div>
  );
}
