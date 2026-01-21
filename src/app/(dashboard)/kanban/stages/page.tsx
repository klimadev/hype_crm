'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  Edit2,
  Check,
  Palette,
  Sparkles,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Stage {
  id: number;
  name: string;
  color: string;
  position: number;
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
];

function SortableStageItem({
  stage,
  onEdit,
  onDelete,
}: {
  stage: Stage;
  onEdit: (stage: Stage) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all
        ${isDragging ? 'opacity-50 ring-2 ring-indigo-500 z-50' : ''}
      `}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-zinc-400" />
      </div>
      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: stage.color }}
      />
      <span className="flex-1 font-medium text-zinc-900 dark:text-white">{stage.name}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(stage)}
          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(stage.id)}
          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StageForm({
  stage,
  onSubmit,
  onCancel,
  loading,
}: {
  stage?: Stage;
  onSubmit: (data: { name: string; color: string }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: stage?.name || '',
    color: stage?.color || '#6366f1',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formData.color }} />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {stage ? 'Editar Estágio' : 'Novo Estágio'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Nome</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            placeholder="Nome do estágio"
            required
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Cor</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded-lg transition-all ${
                  formData.color === color
                    ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                {stage ? 'Salvar' : 'Criar'}
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

export default function StagesPage() {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    try {
      const res = await fetch('/api/stages');
      if (!res.ok) throw new Error('Failed to fetch stages');
      const data = await res.json();
      setStages(data);
    } catch (err) {
      console.error('Error fetching stages:', err);
      setError('Erro ao carregar estágios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: { name: string; color: string }) => {
    setSubmitting(true);
    setError(null);

    try {
      if (editingStage) {
        const res = await fetch('/api/stages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingStage.id, ...data }),
        });
        if (!res.ok) throw new Error('Failed to update stage');
      } else {
        const res = await fetch('/api/stages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create stage');
      }
      setShowForm(false);
      setEditingStage(null);
      fetchStages();
    } catch (err) {
      console.error('Error saving stage:', err);
      setError('Erro ao salvar estágio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este estágio?')) return;

    try {
      const res = await fetch(`/api/stages?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete stage');
      fetchStages();
    } catch (err) {
      console.error('Error deleting stage:', err);
      setError('Erro ao excluir estágio');
    }
  };

  const handleEdit = (stage: Stage) => {
    setEditingStage(stage);
    setShowForm(true);
    setError(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeIndex = stages.findIndex(s => s.id === active.id);
    const overIndex = stages.findIndex(s => s.id === over.id);

    if (activeIndex === overIndex) return;

    const newStages = arrayMove(stages, activeIndex, overIndex);
    const reorderedStages = newStages.map((stage, index) => ({ ...stage, position: index }));

    setStages(reorderedStages);

    try {
      await fetch('/api/stages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: reorderedStages }),
      });
    } catch (err) {
      console.error('Error reordering stages:', err);
      fetchStages();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Carregando estágios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/kanban"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Voltar
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
          <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Gerenciar Estágios</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Customize seu pipeline de vendas</p>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium"
        >
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </motion.div>
      )}

      {showForm ? (
        <StageForm
          stage={editingStage || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingStage(null);
          }}
          loading={submitting}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stages.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3 max-w-2xl">
                {stages.map((stage) => (
                  <SortableStageItem
                    key={stage.id}
                    stage={stage}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            onClick={() => { setShowForm(true); setError(null); }}
            className="mt-4 w-full max-w-2xl flex items-center justify-center gap-2 p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-500 dark:text-zinc-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            Adicionar Estágio
          </button>
        </motion.div>
      )}
    </div>
  );
}

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
