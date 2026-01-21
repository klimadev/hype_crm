'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Phone,
  Package,
  ChevronRight,
  GripVertical,
  Sparkles,
} from 'lucide-react';
import type { Lead, Product } from '@/types';

interface KanbanCardProps {
  lead: Lead;
  products: Product[];
  formatPhone: (phone: string) => string;
  formatDate: (dateString: string) => string;
  isDragging?: boolean;
  onDragStart?: (leadId: number) => void;
  onDragEnd?: () => void;
  onDelete: (leadId: number) => void;
  onDrop?: (leadId: number, stageId: number) => void;
  stageId?: number;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  new: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  contacted: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800', dot: 'bg-cyan-500' },
  qualified: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', dot: 'bg-indigo-500' },
  proposal: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  negotiation: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
  converted: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  lost: { bg: 'bg-zinc-100 dark:bg-zinc-800/50', text: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-700', dot: 'bg-zinc-400' },
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  qualified: 'Qualificado',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  converted: 'Convertido',
  lost: 'Perdido',
};

const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

export default function KanbanCard({
  lead,
  products,
  formatPhone,
  formatDate,
  isDragging: externalIsDragging,
  onDragStart,
  onDragEnd,
  onDelete,
  onDrop,
  stageId,
}: KanbanCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const getProductInfo = (productId: number | null) => {
    if (!productId) return null;
    return products.find((p) => p.id === productId);
  };

  const productInfo = getProductInfo(lead.product_id);
  const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
  const statusLabel = STATUS_LABELS[lead.status] || lead.status;

  const isActiveDragging = isDraggingState || externalIsDragging;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
    e.stopPropagation();
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragStartPos.current) return;
    
    const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
    
    if (deltaX > 5 || deltaY > 5) {
      isDraggingRef.current = true;
      setIsDraggingState(true);
      onDragStart?.(lead.id);
      document.body.style.cursor = 'grabbing';
      e.preventDefault();
      e.stopPropagation();
    }
    
    dragStartPos.current = null;
  }, [lead.id, onDragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDraggingState(false);
    setCardPosition({ x: 0, y: 0 });
    isDraggingRef.current = false;
    onDragEnd?.();
    document.body.style.cursor = '';
  }, [onDragEnd]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !dragStartPos.current) return;
    
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    setCardPosition({ x: deltaX, y: deltaY });
  }, []);

  useEffect(() => {
    if (isDraggingState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDraggingState, handleMouseMove, handleDragEnd]);

  return (
    <div className="relative" ref={cardRef}>
      <motion.div
        layout
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{
          opacity: isActiveDragging ? 0.3 : 1,
          scale: isActiveDragging ? 1.08 : 1,
          x: cardPosition.x,
          y: cardPosition.y,
          rotate: isActiveDragging ? 3 : 0,
          zIndex: isActiveDragging ? 9999 : 1,
        }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={springTransition}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          w-full bg-white dark:bg-zinc-900 rounded-2xl border-2 cursor-grab active:cursor-grabbing select-none
          ${isActiveDragging
            ? 'border-indigo-400 dark:border-indigo-500 shadow-[0_25px_50px_-12px_rgba(99,102,241,0.4)] ring-4 ring-indigo-500/20'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-lg hover:shadow-xl'
          }
          transition-shadow duration-200
        `}
        style={{ 
          touchAction: 'none',
          userSelect: 'none',
          position: isDraggingState ? 'fixed' : 'relative',
          left: isDraggingState ? '50%' : undefined,
          top: isDraggingState ? '50%' : undefined,
          margin: 0,
        }}
      >
        <AnimatePresence>
          {isHovered && !isDraggingState && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute -top-3 -right-3 z-20"
              >
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e);
                  }}
                  className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center shadow-lg cursor-grab ring-2 ring-white dark:ring-zinc-900"
                >
                  <GripVertical className="w-4 h-4 text-white" />
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>

        <Link
          href={`/kanban/leads/${lead.id}`}
          className="block p-5 select-none"
          onClick={(e) => {
            if (isDraggingRef.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <motion.h3
                className="font-bold text-lg text-zinc-900 dark:text-white truncate"
                animate={{ color: isHovered ? '#6366f1' : undefined }}
                transition={{ duration: 0.15 }}
              >
                {lead.name}
              </motion.h3>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mt-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}
              >
                <motion.span
                  className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {statusLabel}
              </motion.div>
            </div>
            <motion.div
              animate={{ 
                x: isHovered ? 5 : 0, 
                opacity: isHovered ? 1 : 0.4,
                scale: isHovered ? 1.1 : 1
              }}
              transition={{ duration: 0.15 }}
            >
              <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
            </motion.div>
          </div>

          {productInfo && (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-3 p-3 rounded-xl mb-3 ${statusConfig.bg} border ${statusConfig.border}`}
            >
              <motion.div
                whileHover={{ rotate: 12, scale: 1.08 }}
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center flex-shrink-0 shadow-md"
              >
                <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900 dark:text-white truncate text-sm">
                  {productInfo.name}
                </p>
                {productInfo.price && (
                  <motion.p
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5"
                    initial={{ opacity: 0.7 }}
                    whileHover={{ opacity: 1, scale: 1.05 }}
                  >
                    R$ {productInfo.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </motion.p>
                )}
              </div>
              <motion.span
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  productInfo.type === 'product'
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                }`}
              >
                {productInfo.type === 'product' ? 'PROD' : 'SERV'}
              </motion.span>
            </motion.div>
          )}

          <div className="flex items-center gap-4 text-sm">
            {lead.phone && (
              <motion.div
                className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400"
                whileHover={{ scale: 1.02, color: '#6366f1' }}
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="font-medium truncate max-w-[100px]">{formatPhone(lead.phone)}</span>
              </motion.div>
            )}
            <motion.div
              className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 ml-auto"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium">{formatDate(lead.created_at)}</span>
            </motion.div>
          </div>
        </Link>
      </motion.div>

      <AnimatePresence>
        {isHovered && !isDraggingState && !externalIsDragging && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute z-[99999] pointer-events-none w-full"
            style={{ top: '100%', marginTop: '8px' }}
          >
            <div className="relative flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 text-white dark:text-zinc-900 text-sm font-semibold rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] whitespace-nowrap">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Arraste para mover
              </div>
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 -top-1"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="w-3 h-3 bg-zinc-900 dark:bg-zinc-100 rotate-45 rounded-sm" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
