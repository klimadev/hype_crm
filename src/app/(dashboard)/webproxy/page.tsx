'use client';

import { useState, useEffect } from 'react';

export default function WebProxyPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [status, setStatus] = useState('Conectando...');
  const [statusColor, setStatusColor] = useState('bg-yellow-500');

  const proxyUrl = '/api/webproxy?url=' + encodeURIComponent('https://web.whatsapp.com');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'wpp-ready') {
        setStatus('WhatsApp Pronto');
        setStatusColor('bg-emerald-500');
        setIsLoaded(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleFrameLoad = () => {
    if (status === 'Conectando...') {
      setStatus('Carregado');
      setStatusColor('bg-blue-500');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor} animate-pulse`} />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{status}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            SSL Ativo
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Proxy Otimizado
          </span>
        </div>
      </div>

      {/* Frame Container */}
      <div className="relative flex-1 bg-zinc-100 dark:bg-zinc-950">
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 z-10">
            <div className="w-12 h-12 border-3 border-zinc-200 dark:border-zinc-800 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">Iniciando WebProxy...</p>
          </div>
        )}
        <iframe
          src={proxyUrl}
          className="w-full h-full border-none"
          onLoad={handleFrameLoad}
          allow="autoplay; camera; microphone; clipboard-read; clipboard-write;"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}
