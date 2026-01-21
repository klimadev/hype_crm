'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Package,
  Calendar,
  Clock,
  ExternalLink,
  Copy,
  Loader2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import type { Lead, Stage, Product } from '@/types';

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id ? parseInt(params.id as string) : null;

  const [lead, setLead] = useState<Lead | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Erro ao carregar lead. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leadId]);

  const getProductInfo = (productId: number | null) => {
    if (!productId) return null;
    return products.find((p) => p.id === productId);
  };

  const getStageInfo = (stageId: number | null) => {
    if (!stageId) return null;
    return stages.find((s) => s.id === stageId);
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return '(' + cleaned.slice(0, 2) + ') ' + cleaned.slice(2, 7) + '-' + cleaned.slice(7);
    }
    return phone;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyPhone = () => {
    if (lead) {
      navigator.clipboard.writeText(lead.phone);
    }
  };

  const openWhatsApp = () => {
    if (lead) {
      window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank');
    }
  };

  const handleDelete = async () => {
    if (!lead) return;

    if (!confirm(`Tem certeza que deseja excluir "${lead.name}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete lead');
      }

      router.push('/kanban');
    } catch (err) {
      console.error('Erro ao excluir lead:', err);
      setError('Erro ao excluir lead. Tente novamente.');
      setDeleting(false);
    }
  };

  const productInfo = lead ? getProductInfo(lead.product_id) : null;
  const stageInfo = lead ? getStageInfo(lead.stage_id) : null;

  const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    contacted: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    qualified: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    proposal: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    negotiation: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    converted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    lost: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
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
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/kanban"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-3 h-3" />
          Voltar ao Kanban
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{lead.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] || STATUS_COLORS.new}`}>
                {STATUS_LABELS[lead.status] || lead.status}
              </span>
              {stageInfo && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: stageInfo.color + '20', color: stageInfo.color }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stageInfo.color }} />
                  {stageInfo.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/kanban/leads/${lead.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-xl font-medium transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Excluir
            </button>
          </div>
        </div>
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

      <div className="grid gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Informações de Contato</h2>
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">Telefone</p>
                <p className="text-zinc-900 dark:text-white font-medium">{formatPhone(lead.phone)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyPhone}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Copiar telefone"
                >
                  <Copy className="w-4 h-4 text-zinc-500" />
                </button>
                <button
                  onClick={openWhatsApp}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Abrir WhatsApp"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            </div>

            {lead.email && (
              <div className="flex items-center gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">E-mail</p>
                  <p className="text-zinc-900 dark:text-white font-medium truncate">{lead.email}</p>
                </div>
                <a
                  href={`mailto:${lead.email}`}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Enviar e-mail"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-500" />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Produto de Interesse</h2>
          {productInfo ? (
            <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-zinc-900 dark:text-white">{productInfo.name}</p>
                {productInfo.description && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{productInfo.description}</p>
                )}
                {productInfo.price && (
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                    R$ {productInfo.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                productInfo.type === 'product' 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
              }`}>
                {productInfo.type === 'product' ? 'Produto' : 'Serviço'}
              </span>
            </div>
          ) : (
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Nenhum produto associado</p>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Informações do Pipeline</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">Estágio atual</p>
                <p className="font-medium text-zinc-900 dark:text-white">{stageInfo?.name || 'Não definido'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <Calendar className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">Criado em</p>
                <p className="font-medium text-zinc-900 dark:text-white">{formatDate(lead.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <Clock className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">Horário</p>
                <p className="font-medium text-zinc-900 dark:text-white">{formatTime(lead.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <Calendar className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">Última atualização</p>
                <p className="font-medium text-zinc-900 dark:text-white">{formatDate(lead.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { X } from 'lucide-react';
