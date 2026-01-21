'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Package,
  Tag,
  DollarSign,
  FileText,
  Edit,
  Trash2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  type: string;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <Sparkles className="w-3 h-3" />
              Catálogo
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Produtos e Serviços</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gerencie seu catálogo de produtos e serviços</p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-zinc-900/20 dark:shadow-zinc-100/10 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-zinc-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-300 dark:focus:border-zinc-600 transition-all duration-200"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Package className="w-10 h-10 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto ainda'}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            {searchTerm 
              ? 'Tente buscar com outro termo ou limpe o filtro' 
              : 'Comece adicionando seu primeiro produto ao catálogo'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group relative bg-white dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-950/50 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
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
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{product.name}</h3>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      product.type === 'product'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {product.type === 'product' ? (
                        <>
                          <Package className="w-3 h-3" />
                          Produto
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Serviço
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-zinc-500 hover:text-red-600"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {product.description && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {product.type === 'product' ? 'Estoque disponível' : 'Serviço ativo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
