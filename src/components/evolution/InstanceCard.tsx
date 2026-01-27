'use client';

import { useState } from 'react';
import { 
  Trash2, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Circle,
  Smartphone,
  MessageSquare,
  Signal
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
  
  const statusConfig = getStatusConfig(instance.connectionStatus || 'created');
  
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
    <div className="group relative bg-white dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-950/50 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusConfig.bgColor} shadow-sm`}>
            <statusConfig.icon className={`w-6 h-6 ${statusConfig.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white text-lg tracking-tight">
              {instance.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${statusConfig.badgeColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${instance.connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : statusConfig.dotColor}`} />
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm py-2 border-t border-zinc-100 dark:border-zinc-800/50">
          <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Número
          </span>
          <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
            {instance.number || '---'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm py-2 border-t border-zinc-100 dark:border-zinc-800/50">
          <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Profile
          </span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">
            {instance.profileName || '---'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm py-2 border-t border-zinc-100 dark:border-zinc-800/50">
          <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <Signal className="w-4 h-4" />
            Owner JID
          </span>
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]" title={instance.ownerJid || ''}>
            {instance.ownerJid ? instance.ownerJid.replace('@s.whatsapp.net', '') : '---'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        {instance.connectionStatus === 'qrcode' && (
          <button
            onClick={() => onShowQr(instance)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
          >
            <QrCode className="w-4 h-4" />
            Ler QR Code
          </button>
        )}

        {instance.connectionStatus === 'disconnected' && (
          <button
            onClick={onRefresh}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Smartphone className="w-4 h-4" />
            Reconectar
          </button>
        )}

        {instance.connectionStatus === 'connected' && (
          <button
            disabled
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl cursor-default"
          >
            <CheckCircle className="w-4 h-4" />
            Online
          </button>
        )}

        {instance.connectionStatus !== 'qrcode' && instance.connectionStatus !== 'disconnected' && instance.connectionStatus !== 'connected' && (
           <button
           disabled
           className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-xl cursor-not-allowed"
         >
           <Loader2 className="w-4 h-4 animate-spin" />
           Aguarde...
         </button>
        )}

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50"
          title="Excluir instância"
        >
          {isDeleting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

function getStatusConfig(status: string) {
  const configs: Record<string, { icon: typeof Circle; color: string; bgColor: string; badgeColor: string; dotColor: string; label: string }> = {
    created: {
      icon: Circle,
      color: 'text-zinc-500',
      bgColor: 'bg-zinc-100 dark:bg-zinc-800',
      badgeColor: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      dotColor: 'bg-zinc-400',
      label: 'Criada',
    },
    connecting: {
      icon: Loader2,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      dotColor: 'bg-amber-500',
      label: 'Conectando',
    },
    connected: {
      icon: Smartphone,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      dotColor: 'bg-emerald-500',
      label: 'Conectado',
    },
    disconnected: {
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      badgeColor: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      dotColor: 'bg-red-500',
      label: 'Desconectado',
    },
    qrcode: {
      icon: QrCode,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      dotColor: 'bg-blue-500',
      label: 'Aguardando Scan',
    },
  };
  
  return configs[status] || configs.created;
}

