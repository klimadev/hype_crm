'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Edit,
  Bell,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  type: 'product' | 'service';
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrence_days: number | null;
  created_at: string;
  updated_at: string;
}

const recurrenceLabels: Record<string, string> = {
  none: 'Sem recorrência',
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  custom: 'Personalizado',
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = parseInt(params.id as string);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Produto não encontrado');
          return;
        }
        throw new Error('Failed to fetch product');
      }
      const data = await res.json();
      setProduct(data);
    } catch (err) {
      console.error('Erro ao buscar produto:', err);
      setError('Erro ao carregar produto.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
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

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
          <Package className="w-6 h-6 text-zinc-400" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{error || 'Produto não encontrado'}</h2>
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
        <div className="flex gap-2">
          <Link
            href={`/products/${product.id}/edit`}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Link>
          <Link
            href={`/products/${product.id}/reminders`}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Lembretes
          </Link>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{product.name}</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Detalhes do produto/serviço</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              product.type === 'product'
                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              {product.type === 'product' ? (
                <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                product.type === 'product'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}>
                {product.type === 'product' ? 'Produto' : 'Serviço'}
              </span>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                ID: {product.id}
              </p>
            </div>
          </div>

          {product.description && (
            <div className="mb-6">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Descrição
              </label>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{product.description}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Preço
              </label>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {formatPrice(product.price)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Recorrência
              </span>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Ciclo de retorno
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Tipo de Recorrência
              </label>
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                {recurrenceLabels[product.recurrence_type] || 'Sem recorrência'}
              </p>
            </div>

            {product.recurrence_type === 'custom' && product.recurrence_days && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Intervalo Personalizado
                </label>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                  A cada {product.recurrence_days} dias
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Criado em {formatDate(product.created_at)}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Última atualização em {formatDate(product.updated_at)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3"
      >
        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Configure lembretes automáticos
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Defina lembretes WhatsApp para notificar clientes quando chegarem no estágio configurado.
          </p>
          <Link
            href={`/products/${product.id}/reminders`}
            className="inline-block mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Gerenciar lembretes →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
