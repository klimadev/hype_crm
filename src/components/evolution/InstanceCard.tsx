'use client';

import { useState } from 'react';
import { 
  Trash2, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Circle,
  Smartphone
} from 'lucide-react';
import { EvolutionInstance } from '@/lib/evolution/types';

interface InstanceCardProps {
  instance: EvolutionInstance;
  onRefresh: () => void;
  onDelete: (name: string) => void;
  onShowQr: (instance: EvolutionInstance) => void;
}

export function InstanceCard({ instance, onRefresh, onDelete, onShowQr }: InstanceCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const statusConfig = getStatusConfig(instance.status);
  
  async function handleDelete() {
    if (!confirm(`Tem certeza que deseja excluir a instância "${instance.name}"?`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await onDelete(instance.name);
    } finally {
      setIsDeleting(false);
    }
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${statusConfig.bgColor}`}>
            <statusConfig.icon className={`w-5 h-5 ${statusConfig.color}`} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {instance.name}
            </h3>
            {instance.profileName && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {instance.profileName}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {instance.number || 'Sem número'}
            </p>
          </div>
        </div>
        
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.badgeColor}`}>
          {statusConfig.label}
        </span>
      </div>
      
      <div className="mt-4 flex items-center gap-2">
        {instance.status === 'qrcode' && (
          <button
            onClick={() => onShowQr(instance)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <QrCode className="w-4 h-4" />
            Ver QR Code
          </button>
        )}
        
        {instance.status === 'disconnected' && (
          <button
            onClick={onRefresh}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            Reconectar
          </button>
        )}
        
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function getStatusConfig(status: string) {
  const configs: Record<string, { icon: typeof Circle; color: string; bgColor: string; badgeColor: string; label: string }> = {
    created: {
      icon: Circle,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      badgeColor: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      label: 'Criada',
    },
    connecting: {
      icon: Loader2,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      badgeColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      label: 'Conectando',
    },
    connected: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      label: 'Conectado',
    },
    disconnected: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      label: 'Desconectado',
    },
    qrcode: {
      icon: QrCode,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      label: 'QR Code',
    },
  };
  
  return configs[status] || configs.created;
}
