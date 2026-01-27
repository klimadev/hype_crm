'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Loader2, Smartphone, Info, RefreshCw } from 'lucide-react';
import { InstanceCard } from '@/components/evolution/InstanceCard';
import { CreateInstanceModal } from '@/components/evolution/CreateInstanceModal';
import { QrCodeModal } from '@/components/evolution/QrCodeModal';
import { EvolutionInstance } from '@/lib/evolution/types';

export default function InstancesPage() {
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [qrCodeInstance, setQrCodeInstance] = useState<EvolutionInstance | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fetchInstances = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/instances');
      
      if (!response.ok) {
        throw new Error('Failed to fetch instances');
      }
      
      const data = await response.json();
      setInstances(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar instâncias';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);
  
  useEffect(() => {
    fetchInstances();
    
    const interval = setInterval(() => {
      fetchInstances();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [fetchInstances]);
  
  async function handleCreate(data: { instanceName: string; number?: string }) {
    try {
      const response = await fetch('/api/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create instance');
      }
      
      const result = await response.json();
      
      await fetchInstances();
      setShowCreateModal(false);
      
      if (result.qrcode) {
        setQrCodeInstance({
          name: result.name,
          number: result.number,
          status: result.status,
          connectionStatus: result.connectionStatus || result.status,
          integration: result.integration,
          qrcode: result.qrcode,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar instância';
      alert(message);
    }
  }
  
  async function handleDelete(name: string) {
    try {
      const response = await fetch(`/api/instances/${name}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete instance');
      }
      
      await fetchInstances();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir instância';
      alert(message);
    }
  }
  
  function handleRefresh(name: string) {
    setQrCodeInstance(instances.find((i) => i.name === name) || null);
  }
  
  function handleShowQr(instance: EvolutionInstance) {
    setQrCodeInstance(instance);
  }
  
  function handleConnected() {
    fetchInstances();
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-xs font-medium text-green-600 dark:text-green-400">
              <Smartphone className="w-3 h-3" />
              Conexões
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Instâncias WhatsApp</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gerencie suas conexões com a Evolution API</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchInstances()}
            disabled={isRefreshing}
            className={`p-2.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            title="Atualizar lista"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-zinc-900/20 dark:shadow-zinc-100/10 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Nova Instância
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-zinc-300 animate-spin" />
            <p className="text-sm font-medium text-zinc-500">Carregando instâncias...</p>
          </div>
        </div>
      ) : instances.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Smartphone className="w-10 h-10 text-green-500/50" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            Nenhuma instância conectada
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-8">
            Conecte seu WhatsApp para começar a enviar mensagens e gerenciar atendimentos.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all hover:shadow-lg hover:shadow-green-600/20"
          >
            <Plus className="w-4 h-4" />
            Criar Primeira Instância
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <InstanceCard
              key={instance.name}
              instance={instance}
              onRefresh={() => handleRefresh(instance.name)}
              onDelete={handleDelete}
              onShowQr={handleShowQr}
            />
          ))}
        </div>
      )}
      
      <div className="flex items-start gap-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Sobre as instâncias</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
            Cada instância representa uma conexão WhatsApp independente. 
            Você pode ter múltiplas instâncias conectadas a números diferentes.
            O status é atualizado automaticamente a cada 5 segundos.
          </p>
        </div>
      </div>
      
      <CreateInstanceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />
      
      {qrCodeInstance && (
        <QrCodeModal
          instance={qrCodeInstance}
          isOpen={!!qrCodeInstance}
          onClose={() => setQrCodeInstance(null)}
          onConnected={handleConnected}
        />
      )}
    </div>
  );
}

