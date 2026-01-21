'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronDown, Check } from 'lucide-react';
import type { Stage, Product, FilterOptions } from '@/types';

interface FilterDropdownProps {
  stages: Stage[];
  products: Product[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onApplyFilters: () => void;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Novo', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'contacted', label: 'Contatado', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'qualified', label: 'Qualificado', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'proposal', label: 'Proposta', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { value: 'negotiation', label: 'Negociação', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'converted', label: 'Convertido', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'lost', label: 'Perdido', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
  mass: 0.8,
};

export default function FilterDropdown({
  stages,
  products,
  filters,
  onFiltersChange,
  onApplyFilters,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = 
    filters.stageIds.length > 0 ||
    filters.productIds.length > 0 ||
    filters.status.length > 0 ||
    filters.dateFrom ||
    filters.dateTo;

  const toggleStage = (stageId: number) => {
    const newStageIds = filters.stageIds.includes(stageId)
      ? filters.stageIds.filter(id => id !== stageId)
      : [...filters.stageIds, stageId];
    onFiltersChange({ ...filters, stageIds: newStageIds });
  };

  const toggleProduct = (productId: number) => {
    const newProductIds = filters.productIds.includes(productId)
      ? filters.productIds.filter(id => id !== productId)
      : [...filters.productIds, productId];
    onFiltersChange({ ...filters, productIds: newProductIds });
  };

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      stageIds: [],
      productIds: [],
      status: [],
      dateFrom: null,
      dateTo: null,
    });
  };

  const applyAndClose = () => {
    onApplyFilters();
    setIsOpen(false);
  };

  const updateDateFilter = (preset: string) => {
    const today = new Date();
    let dateFrom: string | null = null;
    let dateTo: string | null = null;

    switch (preset) {
      case 'today':
        dateFrom = today.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'this_week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        dateFrom = startOfWeek.toISOString().split('T')[0];
        break;
      case 'this_month':
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'last_7_days':
        const last7 = new Date(today);
        last7.setDate(today.getDate() - 7);
        dateFrom = last7.toISOString().split('T')[0];
        break;
      case 'last_30_days':
        const last30 = new Date(today);
        last30.setDate(today.getDate() - 30);
        dateFrom = last30.toISOString().split('T')[0];
        break;
    }

    onFiltersChange({ ...filters, dateFrom, dateTo });
  };

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-4 py-3 border rounded-xl transition-all duration-200 font-medium ${
          hasActiveFilters
            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
            : 'bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
        }`}
      >
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Filter className="w-4 h-4" />
        </motion.span>
        Filtros
        {hasActiveFilters && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 bg-indigo-500 rounded-full"
          />
        )}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={springTransition}
            className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-900 dark:text-white">Filtros</h3>
                {hasActiveFilters && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={clearAllFilters}
                    whileHover={{ scale: 1.05 }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                  >
                    Limpar tudo
                  </motion.button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                    Período
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'today', label: 'Hoje' },
                      { value: 'this_week', label: 'Esta Semana' },
                      { value: 'this_month', label: 'Este Mês' },
                      { value: 'last_7_days', label: 'Últimos 7 dias' },
                      { value: 'last_30_days', label: 'Últimos 30 dias' },
                      { value: 'custom', label: 'Personalizado' },
                    ].map((preset) => (
                      <motion.button
                        key={preset.value}
                        onClick={() => preset.value !== 'custom' && updateDateFilter(preset.value)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                          preset.value === 'custom'
                            ? 'border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                        }`}
                      >
                        {preset.label}
                      </motion.button>
                    ))}
                  </div>
                  {(filters.dateFrom || filters.dateTo) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-2 mt-2"
                    >
                      <input
                        type="date"
                        value={filters.dateFrom || ''}
                        onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || null })}
                        className="flex-1 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white"
                      />
                      <input
                        type="date"
                        value={filters.dateTo || ''}
                        onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || null })}
                        className="flex-1 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white"
                      />
                    </motion.div>
                  )}
                </div>

                {stages.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                      Estágios ({filters.stageIds.length} selecionado{filters.stageIds.length !== 1 ? 's' : ''})
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {stages.map((stage, index) => (
                        <motion.button
                          key={stage.id}
                          onClick={() => toggleStage(stage.id)}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.02 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all ${
                            filters.stageIds.includes(stage.id)
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                          }`}
                        >
                          {filters.stageIds.includes(stage.id) && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <Check className="w-3 h-3" />
                            </motion.span>
                          )}
                          <motion.span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: stage.color }}
                            animate={{
                              scale: filters.stageIds.includes(stage.id) ? [1, 1.2, 1] : 1,
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          {stage.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {products.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                      Produtos ({filters.productIds.length} selecionado{filters.productIds.length !== 1 ? 's' : ''})
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {products.map((product, index) => (
                        <motion.button
                          key={product.id}
                          onClick={() => toggleProduct(product.id)}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.02 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all ${
                            filters.productIds.includes(product.id)
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                          }`}
                        >
                          {filters.productIds.includes(product.id) && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <Check className="w-3 h-3" />
                            </motion.span>
                          )}
                          {product.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                    Status ({filters.status.length} selecionado{filters.status.length !== 1 ? 's' : ''})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status, index) => (
                      <motion.button
                        key={status.value}
                        onClick={() => toggleStatus(status.value)}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all ${
                          filters.status.includes(status.value)
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                        } ${filters.status.includes(status.value) ? '' : 'text-zinc-600 dark:text-zinc-400'}`}
                      >
                        {filters.status.includes(status.value) && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Check className="w-3 h-3" />
                          </motion.span>
                        )}
                        <motion.span
                          className={`w-1.5 h-1.5 rounded-full ${
                            filters.status.includes(status.value) 
                              ? status.color.replace('bg-', '').split(' ')[0].replace('dark:', '')
                              : 'bg-zinc-400'
                          }`}
                          animate={{
                            scale: filters.status.includes(status.value) ? [1, 1.3, 1] : 1,
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        {status.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <motion.button
                onClick={() => setIsOpen(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-medium"
              >
                Cancelar
              </motion.button>
              <motion.button
                onClick={applyAndClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-2 text-sm bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg font-medium transition-colors"
              >
                Aplicar
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
