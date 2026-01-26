'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Tag,
  DollarSign,
  FileText,
  Save,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  type: 'product' | 'service';
  recurrence_type: string;
}

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Sem recorrência' },
  { value: 'minute_30', label: 'A cada 30 minutos' },
  { value: 'hour_1', label: 'A cada 1 hora' },
  { value: 'hour_2', label: 'A cada 2 horas' },
  { value: 'hour_4', label: 'A cada 4 horas' },
  { value: 'hour_8', label: 'A cada 8 horas' },
  { value: 'day_1', label: 'Diário (1 dia)' },
  { value: 'day_3', label: 'A cada 3 dias' },
  { value: 'day_7', label: 'Semanal (7 dias)' },
  { value: 'day_15', label: 'A cada 15 dias' },
  { value: 'day_30', label: 'Mensal (30 dias)' },
  { value: 'day_60', label: 'A cada 60 dias' },
  { value: 'day_90', label: 'A cada 90 dias' },
  { value: 'month_1', label: 'Mensal (1 mês)' },
  { value: 'month_2', label: 'A cada 2 meses' },
  { value: 'month_3', label: 'A cada 3 meses' },
  { value: 'month_6', label: 'A cada 6 meses' },
];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = parseInt(params.id as string);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    type: 'product',
    recurrence_type: 'none',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        throw new Error('Failed to fetch product');
      }
      const product = await res.json();
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        type: product.type || 'product',
        recurrence_type: product.recurrence_type || 'none',
      });
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Error loading product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          type: formData.type,
          recurrence_type: formData.recurrence_type,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update product');
      }

      router.push('/products');
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      setError('Erro ao atualizar produto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete product');
      }

      router.push('/products');
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      setError('Erro ao excluir produto. Tente novamente.');
    }
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

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-zinc-400" />
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Produto não encontrado</h2>
        <Link
          href="/products"
          className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Voltar para produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Voltar
          </Link>
        </div>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Excluir
        </button>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight"
      >
        Editar Produto
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-zinc-500 dark:text-zinc-400"
      >
        Atualize as informações do produto
      </motion.p>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onSubmit={handleSubmit}
        className="max-w-lg space-y-5"
      >
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
            Nome *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Package className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
              placeholder="Nome do produto"
              required
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
            Tipo *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="h-5 w-5 text-zinc-400" />
            </div>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'product' | 'service' })}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="product">Produto</option>
              <option value="service">Serviço</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
            Preço
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
            Descrição
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <FileText className="h-5 w-5 text-zinc-400" />
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 resize-none"
              rows={4}
              placeholder="Descrição do produto"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
            Recorrência
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <RefreshCw className="h-5 w-5 text-zinc-400" />
            </div>
            <select
              value={formData.recurrence_type}
              onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value })}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 appearance-none cursor-pointer"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/products"
            className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 text-white dark:text-zinc-900 rounded-xl font-semibold shadow-lg shadow-zinc-900/20 dark:shadow-zinc-100/10 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
