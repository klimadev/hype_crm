'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  ArrowLeft,
  Package,
  Tag,
  DollarSign,
  FileText,
  Save,
} from 'lucide-react';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  type: 'product' | 'service';
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: '',
  type: 'product',
};

export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create product');
      }

      router.push('/products');
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      setError('Erro ao criar produto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Voltar
        </Link>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight"
      >
        Novo Produto
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-zinc-500 dark:text-zinc-400"
      >
        Adicione um novo produto ao catálogo
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
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
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
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 appearance-none cursor-pointer"
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
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
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
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 resize-none"
              rows={4}
              placeholder="Descrição do produto"
            />
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
            disabled={loading}
            className="flex-1 px-4 py-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 text-white dark:text-zinc-900 rounded-xl font-semibold shadow-lg shadow-zinc-900/20 dark:shadow-zinc-100/10 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Criar
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}

import { motion } from 'framer-motion';
