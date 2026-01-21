'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  Package,
  Loader2,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';
import type { Stage, Product, Lead, UpdateLeadData } from '@/types';

export default function EditLeadPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id ? parseInt(params.id as string) : null;

  const [lead, setLead] = useState<Lead | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateLeadData>({
    name: '',
    phone: '',
    email: '',
    stage_id: undefined,
    product_id: undefined,
    status: 'new',
  });

  useEffect(() => {
    if (!leadId) {
      setError('Lead não encontrado');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [leadRes, stagesRes, productsRes] = await Promise.all([
          fetch(`/api/leads/${leadId}`),
          fetch('/api/stages'),
          fetch('/api/products'),
        ]);

        if (!leadRes.ok) {
          throw new Error('Lead não encontrado');
        }

        const leadData = await leadRes.json();
        const stagesData = await stagesRes.json();
        const productsData = await productsRes.json();

        setLead(leadData);
        setStages(stagesData);
        setProducts(productsData);

        setFormData({
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email || '',
          stage_id: leadData.stage_id || undefined,
          product_id: leadData.product_id || undefined,
          status: leadData.status,
        });
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Erro ao carregar lead. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update lead');
      }

      router.push(`/kanban/leads/${lead.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar lead. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_OPTIONS = [
    { value: 'new', label: 'Novo' },
    { value: 'contacted', label: 'Contatado' },
    { value: 'qualified', label: 'Qualificado' },
    { value: 'proposal', label: 'Proposta' },
    { value: 'negotiation', label: 'Negociação' },
    { value: 'converted', label: 'Convertido' },
    { value: 'lost', label: 'Perdido' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{error || 'Lead não encontrado'}</span>
          <Link href="/kanban" className="hover:text-red-800 dark:hover:text-red-300 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/kanban/leads/${lead.id}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-3 h-3" />
          Voltar aos detalhes
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Editar Lead</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Atualize as informações do lead</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="hover:text-red-800 dark:hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
            Nome completo *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
            placeholder="Digite o nome do lead"
            required
            disabled={submitting}
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
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
              placeholder="(11) 99999-9999"
              required
              disabled={submitting}
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
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
              placeholder="email@exemplo.com"
              disabled={submitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 cursor-pointer disabled:opacity-50"
              disabled={submitting}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
              Estágio
            </label>
            <select
              value={formData.stage_id || ''}
              onChange={(e) => setFormData({ ...formData, stage_id: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 cursor-pointer disabled:opacity-50"
              disabled={submitting}
            >
              <option value="">Selecione um estágio</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {products.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
              Produto de interesse
            </label>
            <select
              value={formData.product_id || ''}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 cursor-pointer disabled:opacity-50"
              disabled={submitting}
            >
              <option value="">Selecione um produto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - R$ {product.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push(`/kanban/leads/${lead.id}`)}
            disabled={submitting}
            className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/20 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
