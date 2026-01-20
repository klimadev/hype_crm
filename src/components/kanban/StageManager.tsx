'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  GripVertical,
  Trash2,
  Edit2,
  Check,
  Palette
} from 'lucide-react';

interface Stage {
  id: number;
  name: string;
  color: string;
  position: number;
}

interface StageManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
];

export default function StageManager({ isOpen, onClose, onUpdate }: StageManagerProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#6366f1' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedStage, setDraggedStage] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) fetchStages();
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingStage) {
        const res = await fetch('/api/stages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingStage.id, ...formData }),
        });
        if (!res.ok) throw new Error('Failed to update stage');
      } else {
        const res = await fetch('/api/stages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to create stage');
      }
      setShowForm(false);
      setEditingStage(null);
      setFormData({ name: '', color: '#6366f1' });
      fetchStages();
      onUpdate();
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
      onUpdate();
    } catch (err) {
      console.error('Error deleting stage:', err);
      setError('Erro ao excluir estágio');
    }
  };

  const handleEdit = (stage: Stage) => {
    setEditingStage(stage);
    setFormData({ name: stage.name, color: stage.color });
    setShowForm(true);
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedStage(id);
    e.dataTransfer.setData('stageId', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggedStage === null || draggedStage === targetId) return;

    const draggedIndex = stages.findIndex(s => s.id === draggedStage);
    const targetIndex = stages.findIndex(s => s.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newStages = [...stages];
    const [removed] = newStages.splice(draggedIndex, 1);
    newStages.splice(targetIndex, 0, removed);

    const reorderedStages = newStages.map((stage, index) => ({ ...stage, position: index }));

    setStages(reorderedStages);

    try {
      await fetch('/api/stages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: reorderedStages }),
      });
      onUpdate();
    } catch (err) {
      console.error('Error reordering stages:', err);
      fetchStages();
    }

    setDraggedStage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-zoom-in-95 duration-200 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
              <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Gerenciar Estágios</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Customize seu pipeline de vendas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
            </div>
          ) : showForm ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formData.color }} />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {editingStage ? 'Editar Estágio' : 'Novo Estágio'}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Nome do estágio"
                  required
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
                  onClick={() => {
                    setShowForm(false);
                    setEditingStage(null);
                    setFormData({ name: '', color: '#6366f1' });
                  }}
                  className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingStage ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="space-y-2">
                {stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, stage.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
                    className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="w-4 h-4 text-zinc-400 cursor-grab" />
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                    <span className="flex-1 font-medium text-zinc-900 dark:text-white">{stage.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(stage)}
                        className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(stage.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setShowForm(true); setError(null); }}
                className="w-full mt-4 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-500 dark:text-zinc-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all font-medium"
              >
                <Plus className="w-5 h-5" />
                Adicionar Estágio
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
