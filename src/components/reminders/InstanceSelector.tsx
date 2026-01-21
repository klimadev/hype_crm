import { useState } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  CheckCircle2,
  XCircle,
  Plus,
  ChevronDown,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface Instance {
  name: string;
  profileName?: string;
  ownerJid?: string;
  connectionStatus: string;
}

interface InstanceSelectorProps {
  instances: Instance[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function InstanceSelector({ instances, value, onChange, error }: InstanceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const connectedInstances = instances.filter((i) => i.connectionStatus === 'connected');
  const disconnectedInstances = instances.filter((i) => i.connectionStatus !== 'connected');
  const filteredInstances = instances.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.profileName?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedInstance = instances.find((i) => i.name === value);
  const isConnected = selectedInstance?.connectionStatus === 'connected';

  const formatPhone = (jid?: string) => {
    if (!jid) return null;
    const phone = jid.replace('@s.whatsapp.net', '');
    if (phone.length >= 10) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1 mb-1.5">
        Instância WhatsApp *
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full pl-11 pr-10 py-3 bg-zinc-50 dark:bg-zinc-950/50 border rounded-xl text-left transition-all cursor-pointer ${
          error
            ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20'
            : value && !isConnected
              ? 'border-amber-300 dark:border-amber-600 focus:border-amber-500 focus:ring-amber-500/20'
              : 'border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-blue-500/20'
        }`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MessageCircle className={`h-5 w-5 ${value ? (isConnected ? 'text-green-500' : 'text-amber-500') : 'text-zinc-400'}`} />
        </div>

        {value ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-sm font-medium text-zinc-900 dark:text-white">
                {selectedInstance?.name}
              </span>
              {selectedInstance?.profileName && (
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedInstance.profileName} {formatPhone(selectedInstance.ownerJid)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                  <XCircle className="w-3 h-3" />
                  Desconectado
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Selecione uma instância...</span>
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-700">
            <input
              type="text"
              placeholder="Buscar instância..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {connectedInstances.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                  Conectadas ({connectedInstances.length})
                </p>
                {connectedInstances
                  .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
                  .map((instance) => (
                    <button
                      key={instance.name}
                      type="button"
                      onClick={() => {
                        onChange(instance.name);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-3 transition-colors ${
                        value === instance.name
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {instance.name}
                        </p>
                        {instance.profileName && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {instance.profileName} {formatPhone(instance.ownerJid)}
                          </p>
                        )}
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    </button>
                  ))}
              </div>
            )}

            {disconnectedInstances.length > 0 && (
              <div className="p-2 border-t border-zinc-100 dark:border-zinc-700">
                <p className="px-2 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  Desconectadas ({disconnectedInstances.length})
                </p>
                {disconnectedInstances
                  .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
                  .map((instance) => (
                    <button
                      key={instance.name}
                      type="button"
                      onClick={() => {
                        onChange(instance.name);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-3 transition-colors ${
                        value === instance.name
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {instance.name}
                        </p>
                        {instance.profileName && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {instance.profileName} {formatPhone(instance.ownerJid)}
                          </p>
                        )}
                      </div>
                      <XCircle className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    </button>
                  ))}
              </div>
            )}

            {filteredInstances.length === 0 && (
              <div className="p-4 text-center">
                <Smartphone className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Nenhuma instância encontrada
                </p>
              </div>
            )}
          </div>

          <div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
            <Link
              href="/instances"
              target="_blank"
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Plus className="w-4 h-4" />
              Criar Nova Instância
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 ml-1">{error}</p>
      )}

      {value && !isConnected && (
        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <span className="font-medium">Atenção:</span> Esta instância está desconectada. Os lembretes não serão enviados até que a instância seja reconectada na página de instâncias.
          </p>
        </div>
      )}
    </div>
  );
}
