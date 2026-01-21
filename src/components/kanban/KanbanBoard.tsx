'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Search,
  AlertCircle,
  Settings2,
  ArrowLeft,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { Lead, Stage, Product, FilterOptions } from '@/types';
import FilterDropdown from './FilterDropdown';
import { LoadingScreen } from '@/components/LoadingComponents';

const DEFAULT_FILTERS: FilterOptions = {
  search: '',
  stageIds: [],
  productIds: [],
  status: [],
  dateFrom: null,
  dateTo: null,
};

const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

function StageColumn({
  stage,
  stageLeads,
  products,
  formatPhone,
  formatDate,
  activeDragId,
  onDragEnd,
  onDeleteLead,
  onAddLead,
}: {
  stage: Stage;
  stageLeads: Lead[];
  products: Product[];
  formatPhone: (phone: string) => string;
  formatDate: (dateString: string) => string;
  activeDragId: number | null;
  onDragEnd: () => void;
  onDeleteLead: (leadId: number) => void;
  onAddLead: (stageId: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <motion.div
      ref={setNodeRef}
      key={stage.id}
      layout
      initial={{ opacity: 0, scale: 0.95, x: 30 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: 0,
      }}
      exit={{ opacity: 0, scale: 0.9, x: -30 }}
      transition={{
        ...springTransition,
        delay: 0,
      }}
      className={`
        flex-shrink-0 w-80 transition-all duration-300
        ${isOver && activeDragId ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-transparent bg-indigo-50/50 dark:bg-indigo-950/20' : ''}
      `}
      style={{
        backgroundColor: `${stage.color}08`,
        borderRadius: '1rem',
      }}
    >
      <div className="relative p-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stage.color }}
              animate={{
                scale: [1, 1.3, 1],
                boxShadow: [
                  `0 0 0 0 ${stage.color}40`,
                  `0 0 20px 4px ${stage.color}30`,
                  `0 0 0 0 ${stage.color}40`,
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-base">
              {stage.name}
            </h3>
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{
                backgroundColor: `${stage.color}20`,
                color: stage.color,
              }}
            >
              {stageLeads.length}
            </motion.span>
          </div>
          <StageCardMenu
            stage={stage}
            leadCount={stageLeads.length}
            onEdit={() => {}}
            onDelete={() => {}}
            onDuplicate={() => {}}
            onAddLead={() => {}}
          />
        </motion.div>
        
        <motion.div
          className="space-y-3 min-h-[120px]"
          layout
        >
          <AnimatePresence mode="popLayout">
            {stageLeads.map((lead, leadIndex) => (
              <DraggableKanbanCard
                key={lead.id}
                lead={lead}
                products={products}
                formatPhone={formatPhone}
                formatDate={formatDate}
                isDragging={activeDragId === lead.id}
                onDelete={onDeleteLead}
              />
            ))}
          </AnimatePresence>
          {stageLeads.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-10"
            >
              <motion.div
                className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: `${stage.color}15` }}
                animate={{
                  y: [0, -6, 0],
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <Plus className="w-6 h-6" style={{ color: stage.color }} />
              </motion.div>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">
                Nenhum lead
              </p>
              <p className="text-zinc-300 dark:text-zinc-600 text-xs mt-1">
                Arraste ou adicione um novo
              </p>
            </motion.div>
          )}
        </motion.div>
        
        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,0,0,0.04)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAddLead(stage.id)}
          className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 bg-zinc-100/50 dark:bg-zinc-800/30 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-xl transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Adicionar lead
        </motion.button>
      </div>
    </motion.div>
  );
}

function DraggableKanbanCard({
  lead,
  products,
  formatPhone,
  formatDate,
  isDragging,
  onDelete,
}: {
  lead: Lead;
  products: Product[];
  formatPhone: (phone: string) => string;
  formatDate: (dateString: string) => string;
  isDragging: boolean;
  onDelete: (leadId: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
  });

  const productInfo = products.find(p => p.id === lead.product_id);
  const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
  const statusLabel = STATUS_LABELS[lead.status] || lead.status;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        scale: isDragging ? 1.05 : 1,
        ...style,
      }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={springTransition}
      {...listeners}
      {...attributes}
      className={`
        relative bg-white dark:bg-zinc-900 rounded-2xl border-2 cursor-grab active:cursor-grabbing select-none
        ${isDragging
          ? 'border-indigo-400 dark:border-indigo-500 shadow-[0_25px_50px_-12px_rgba(99,102,241,0.4)] ring-4 ring-indigo-500/20 z-50'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-lg hover:shadow-xl'
        }
        transition-shadow duration-200
      `}
    >
      <Link
        href={`/kanban/leads/${lead.id}`}
        className="block p-5"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white truncate">
              {lead.name}
            </h3>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mt-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusLabel}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
        </div>

        {productInfo && (
          <div className={`flex items-center gap-3 p-3 rounded-xl mb-3 ${statusConfig.bg} border ${statusConfig.border}`}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center flex-shrink-0 shadow-md">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-white truncate text-sm">
                {productInfo.name}
              </p>
              {productInfo.price && (
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  R$ {productInfo.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              productInfo.type === 'product'
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
            }`}>
              {productInfo.type === 'product' ? 'PROD' : 'SERV'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm">
          {lead.phone && (
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <span className="font-medium truncate max-w-[100px]">{formatPhone(lead.phone)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 ml-auto">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-medium">{formatDate(lead.created_at)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
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

import { Package, ChevronRight, Phone } from 'lucide-react';

function StageCardMenu({
  stage,
  leadCount,
  onEdit,
  onDelete,
  onDuplicate,
  onAddLead,
}: {
  stage: Stage;
  leadCount: number;
  onEdit: () => void;
  onDelete: (stageId: number) => void;
  onDuplicate: (stage: Stage) => void;
  onAddLead: (stageId: number) => void;
}) {
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
    onEdit();
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
    },
    {
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      label: 'Editar estágio',
      action: handleEdit,
    },
    {
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Duplicar',
      action: handleDuplicate,
    },
    {
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      label: 'Excluir',
      action: handleDelete,
      danger: true,
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors"
        title="Mais opções"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={springTransition}
            className="absolute right-0 top-full mt-1 min-w-[180px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="py-1">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.label}
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
                    whileHover={{ rotate: item.danger ? -15 : 15, scale: 1.1 }}
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

export default function KanbanBoard() {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [error, setError] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stagesRes, leadsRes, productsRes] = await Promise.all([
        fetch('/api/stages'),
        fetch('/api/leads'),
        fetch('/api/products'),
      ]);

      if (!stagesRes.ok || !leadsRes.ok || !productsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const stagesData = await stagesRes.json();
      const leadsData = await leadsRes.json();
      const productsData = await productsRes.json();

      setStages(stagesData);
      setLeads(leadsData.leads || []);
      setProducts(productsData);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadsWithFilters = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) {
        params.set('search', filters.search);
      }
      if (filters.stageIds.length > 0) {
        params.set('stage_id', filters.stageIds.join(','));
      }
      if (filters.productIds.length > 0) {
        params.set('product_id', filters.productIds.join(','));
      }
      if (filters.status.length > 0) {
        params.set('status', filters.status.join(','));
      }
      if (filters.dateFrom) {
        params.set('date_from', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.set('date_to', filters.dateTo);
      }

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
    }
  }, [filters]);

  useEffect(() => {
    fetchLeadsWithFilters();
  }, [filters, fetchLeadsWithFilters]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as number);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    document.body.style.cursor = '';

    if (!over) return;

    const leadId = active.id as number;
    const targetStageId = over.id as number;

    const leadToMove = leads.find(l => l.id === leadId);
    if (!leadToMove || leadToMove.stage_id === targetStageId) return;

    const previousLeadsState = [...leads];

    setLeads(prev => prev.map(lead =>
      lead.id === leadId ? { ...lead, stage_id: targetStageId } : lead
    ));

    fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: targetStageId }),
    }).then(res => {
      if (!res.ok) throw new Error('Failed to move lead');
      setError(null);
      fetchLeadsWithFilters();
    }).catch(err => {
      console.error('Erro ao mover lead:', err);
      setLeads(previousLeadsState);
      setError('Erro ao mover lead. Tente novamente.');
    });
  }, [leads, fetchLeadsWithFilters]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      document.body.style.cursor = 'grabbing';
    } else {
      document.body.style.cursor = '';
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
    document.body.style.cursor = '';
  }, []);

  const handleDeleteLead = async (leadId: number) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete lead');
      }

      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (err) {
      console.error('Erro ao excluir lead:', err);
      setError('Erro ao excluir lead. Tente novamente.');
    }
  };

  const handleAddLeadToStage = (stageId: number) => {
    const params = new URLSearchParams();
    params.set('stage', stageId.toString());
    router.push(`/kanban/leads/new?${params.toString()}`);
  };

  const handleCreateLeadClick = () => {
    router.push('/kanban/leads/new');
  };

  const getLeadsByStage = (stageId: number) => {
    return leads.filter((lead) => lead.stage_id === stageId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return '(' + cleaned.slice(0, 2) + ') ' + cleaned.slice(2, 7) + '-' + cleaned.slice(7);
    }
    return phone;
  };

  const applyFilters = () => {
    fetchLeadsWithFilters();
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingScreen />
      </div>
    );
  }

  const activeLead = activeDragId ? leads.find(l => l.id === activeDragId) : null;

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={springTransition}
            className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium shadow-lg"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto hover:text-red-800 dark:hover:text-red-300 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-1"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Voltar
            </Link>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight"
          >
            Quadro Kanban
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 dark:text-zinc-400 mt-1"
          >
            Gerencie seus leads e acompanhe o progresso das vendas
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2"
        >
          <Link
            href="/kanban/stages"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
          >
            <Settings2 className="w-5 h-5" />
            Estágios
          </Link>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateLeadClick}
            className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-zinc-900/20 dark:shadow-zinc-100/10"
          >
            <Plus className="w-5 h-5" />
            Novo Lead
          </motion.button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, ...springTransition }}
        className="flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div className="relative flex-1 max-w-md">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10"
          >
            <Search className="h-5 w-5 text-zinc-400" />
          </motion.div>
          <input
            type="text"
            placeholder="Buscar leads..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all duration-200 shadow-sm"
          />
        </div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
          <FilterDropdown
            stages={stages}
            products={products}
            filters={filters}
            onFiltersChange={setFilters}
            onApplyFilters={applyFilters}
          />
        </motion.div>
      </motion.div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragCancel={handleDragCancel}
      >
        <motion.div
          className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-hide"
          layout
        >
          <AnimatePresence mode="popLayout">
            {stages.map((stage, index) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              stageLeads={getLeadsByStage(stage.id)}
              products={products}
              formatPhone={formatPhone}
              formatDate={formatDate}
              activeDragId={activeDragId}
              onDragEnd={handleDragCancel}
              onDeleteLead={handleDeleteLead}
              onAddLead={handleAddLeadToStage}
            />
            ))}
          </AnimatePresence>
        </motion.div>

        <DragOverlay>
          {activeLead ? (
            <div className="opacity-90 rotate-3 cursor-grabbing">
              <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border-2 border-indigo-400 dark:border-indigo-500 shadow-[0_25px_50px_-12px_rgba(99,102,241,0.4)] ring-4 ring-indigo-500/20 p-5 w-80">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white truncate">
                      {activeLead.name}
                    </h3>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mt-2 ${STATUS_CONFIG[activeLead.status]?.bg} ${STATUS_CONFIG[activeLead.status]?.text} ${STATUS_CONFIG[activeLead.status]?.border} border`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[activeLead.status]?.dot}`} />
                      {STATUS_LABELS[activeLead.status] || activeLead.status}
                    </div>
                  </div>
                </div>
                {activeLead.phone && (
                  <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <Phone className="w-4 h-4" />
                    <span className="font-medium">{formatPhone(activeLead.phone)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
