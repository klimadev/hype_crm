'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Loader2, Smartphone, Info } from 'lucide-react';
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
  
  const fetchInstances = useCallback(async () => {
    try {
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Instâncias WhatsApp
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerencie suas conexões com a Evolution API
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Instância
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : instances.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Smartphone className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhuma instância encontrada
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Crie sua primeira instância para começar a usar o WhatsApp
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Instância
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">Sobre as instâncias</p>
            <p>
              Cada instância representa uma conexão WhatsApp independente. 
              Você pode ter múltiplas instâncias conectadas a números diferentes.
              O status é atualizado automaticamente a cada 5 segundos.
            </p>
          </div>
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
