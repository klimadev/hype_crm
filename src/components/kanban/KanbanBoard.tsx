'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  X,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  AlertCircle,
  Settings2
} from 'lucide-react';
import StageManager from './StageManager';

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  stage_id: number;
  stage_name: string | null;
  product_name: string | null;
  created_at: string;
}

interface Stage {
  id: number;
  name: string;
  color: string;
  position: number;
}

export default function KanbanBoard() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showStageManager, setShowStageManager] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stagesRes, leadsRes] = await Promise.all([
        fetch('/api/stages'),
        fetch('/api/leads'),
      ]);

      if (!stagesRes.ok || !leadsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const stagesData = await stagesRes.json();
      const leadsData = await leadsRes.json();
      setStages(stagesData);
      setLeads(leadsData.leads || []);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    e.dataTransfer.setData('leadId', leadId.toString());
    setDraggingLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, stageId: number) => {
    e.preventDefault();
    const leadId = parseInt(e.dataTransfer.getData('leadId'));
    setDraggingLeadId(null);

    if (isNaN(leadId)) return;

    const leadToMove = leads.find(l => l.id === leadId);
    if (!leadToMove) return;

    const previousLeadsState = [...leads];

    setLeads(prev => prev.map(lead =>
      lead.id === leadId ? { ...lead, stage_id: stageId } : lead
    ));

    try {
      const res = await fetch('/api/leads/' + leadId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_id: stageId }),
      });

      if (!res.ok) {
        throw new Error('Failed to move lead');
      }

      setError(null);
      fetchData();
    } catch (err) {
      console.error('Erro ao mover lead:', err);
      setLeads(previousLeadsState);
      setError('Erro ao mover lead. Tente novamente.');
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          stage_id: selectedStage,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create lead');
      }

      fetchData();
      setShowLeadForm(false);
      setFormData({ name: '', phone: '', email: '' });
      setSelectedStage(null);
    } catch (err) {
      console.error('Erro ao criar lead:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar lead. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getLeadsByStage = (stageId: number) => {
    return leads.filter((lead) =>
      lead.stage_id === stageId &&
      lead.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

  const getStageStyle = (stage: Stage, index: number) => {
    const colors = [
      'bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/50',
      'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/30',
      'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30',
      'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30',
    ];
    return colors[index % colors.length];
  };

  const getLuminance = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  };

  const getTextColor = (bgColor: string) => {
    return getLuminance(bgColor) > 128 ? '#000000' : '#ffffff';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Carregando quadro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StageManager isOpen={showStageManager} onClose={() => setShowStageManager(false)} onUpdate={fetchData} />

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto hover:text-red-800 dark:hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <Sparkles className="w-3 h-3" />
              Pipeline de Vendas
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Quadro Kanban</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gerencie seus leads e acompanhe o progresso das vendas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStageManager(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium transition-colors"
          >
            <Settings2 className="w-5 h-5" />
            Estágios
          </button>
          <button
            onClick={() => { setShowLeadForm(true); setError(null); }}
            className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-zinc-900/20 dark:shadow-zinc-100/10 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Novo Lead
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-300 dark:focus:border-zinc-600 transition-all duration-200"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors font-medium">
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {showLeadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Novo Lead</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Adicione um novo lead ao pipeline</p>
                </div>
              </div>
              <button
                onClick={() => { setShowLeadForm(false); setError(null); }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <form onSubmit={handleAddLead} className="p-6 space-y-5">
              {error && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                  Nome completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-300 dark:focus:border-zinc-600 transition-all duration-200"
                  placeholder="Digite o nome do lead"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                  Telefone *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-300 dark:focus:border-zinc-600 transition-all duration-200"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-300 dark:focus:border-zinc-600 transition-all duration-200"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                  Estagio inicial
                </label>
                <select
                  value={selectedStage || ''}
                  onChange={(e) => setSelectedStage(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-300 dark:focus:border-zinc-600 transition-all duration-200 cursor-pointer"
                >
                  <option value="">Selecione um estagio</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowLeadForm(false); setError(null); }}
                  className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-semibold shadow-lg shadow-zinc-900/20 dark:shadow-zinc-100/10 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Lead'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex overflow-x-auto gap-4 pb-4 -mx-4">
        {stages.map((stage, index) => {
          const stageLeads = getLeadsByStage(stage.id);
          const bgColorWithOpacity = `${stage.color}15`;
          const borderColorWithOpacity = `${stage.color}40`;

          return (
            <div
              key={stage.id}
              className={'flex-shrink-0 w-80 ' + getStageStyle(stage, index) + ' rounded-2xl p-4'}
              style={{
                borderColor: borderColorWithOpacity,
                backgroundColor: bgColorWithOpacity,
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">{stage.name}</h3>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: stage.color + '20',
                      color: stage.color,
                    }}
                  >
                    {stageLeads.length}
                  </span>
                </div>
                <button className="p-1.5 hover:bg-white/60 dark:hover:bg-zinc-800/60 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
              <div className="space-y-3 min-h-[100px]">
                {stageLeads.map((lead) => (
                  <KanbanCard
                    key={lead.id}
                    lead={lead}
                    onDragStart={handleDragStart}
                    formatPhone={formatPhone}
                    formatDate={formatDate}
                    isDragging={draggingLeadId === lead.id}
                  />
                ))}
                {stageLeads.length === 0 && (
                  <div className="text-center py-8 text-zinc-400 dark:text-zinc-500 text-sm">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                      style={{ backgroundColor: stage.color + '20' }}
                    >
                      <Plus className="w-5 h-5" style={{ color: stage.color }} />
                    </div>
                    Nenhum lead
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface KanbanCardProps {
  lead: Lead;
  onDragStart: (e: React.DragEvent, leadId: number) => void;
  formatPhone: (phone: string) => string;
  formatDate: (dateString: string) => string;
  isDragging?: boolean;
}

function KanbanCard({ lead, onDragStart, formatPhone, formatDate, isDragging }: KanbanCardProps) {
  const waLink = 'https://wa.me/' + lead.phone.replace(/\D/g, '');
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      className={'bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700 cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-950/50 transition-all duration-200 group' + (isDragging ? ' opacity-50' : '')}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-zinc-900 dark:text-white">{lead.name}</h4>
          {lead.product_name && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">{lead.product_name}</p>
          )}
        </div>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          title="Abrir WhatsApp"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </div>
      <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        {lead.phone && (
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>{formatPhone(lead.phone)}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(lead.created_at)}</span>
        </div>
      </div>
      {lead.email && (
        <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-700">
          <Mail className="w-3 h-3" />
          <span className="truncate">{lead.email}</span>
        </div>
      )}
    </div>
  );
}
