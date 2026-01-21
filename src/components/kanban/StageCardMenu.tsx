'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Edit2, Trash2, Plus, Copy } from 'lucide-react';
import type { Stage } from '@/types';

interface StageCardMenuProps {
  stage: Stage;
  onEdit: (stage: Stage) => void;
  onDelete: (stageId: number) => void;
  onDuplicate: (stage: Stage) => void;
  onAddLead: (stageId: number) => void;
  leadCount: number;
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
  mass: 0.8,
};

export default function StageCardMenu({
  stage,
  onEdit,
  onDelete,
  onDuplicate,
  onAddLead,
  leadCount,
}: StageCardMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const firstItem = menuRef.current?.querySelector('[data-menu-item]') as HTMLElement;
      firstItem?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleEdit = () => {
    onEdit(stage);
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (leadCount > 0) {
      alert(`Este estágio possui ${leadCount} lead(s). Mova-os antes de excluir.`);
      setIsOpen(false);
      return;
    }
    if (confirm(`Tem certeza que deseja excluir o estágio "${stage.name}"?`)) {
      onDelete(stage.id);
    }
    setIsOpen(false);
  };

  const handleDuplicate = () => {
    onDuplicate(stage);
    setIsOpen(false);
  };

  const handleAddLead = () => {
    onAddLead(stage.id);
    setIsOpen(false);
  };

  const menuItems = [
    {
      icon: Plus,
      label: 'Adicionar lead',
      action: handleAddLead,
      show: true,
    },
    {
      icon: Edit2,
      label: 'Editar estágio',
      action: handleEdit,
      show: true,
    },
    {
      icon: Copy,
      label: 'Duplicar',
      action: handleDuplicate,
      show: true,
    },
    {
      icon: Trash2,
      label: 'Excluir',
      action: handleDelete,
      show: true,
      danger: true,
    },
  ];

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-white/60 dark:hover:bg-zinc-800/60 rounded-lg transition-colors"
        title="Mais opções"
      >
        <MoreHorizontal className="w-4 h-4 text-zinc-500" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={springTransition}
            className="absolute right-0 top-full mt-1 min-w-[180px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="py-1">
              {menuItems.filter(item => item.show).map((item, index) => (
                <motion.button
                  key={index}
                  data-menu-item
                  onClick={item.action}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                    item.danger
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                  }`}
                >
                  <motion.span
                    whileHover={{ rotate: 15, scale: 1.1 }}
                  >
                    <item.icon className={`w-4 h-4 ${item.danger ? 'text-red-500' : 'text-zinc-400'}`} />
                  </motion.span>
                  {item.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
