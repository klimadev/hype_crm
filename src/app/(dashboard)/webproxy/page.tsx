
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export default function WebProxyPage() {
  const [status, setStatus] = useState('');

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const maxAttempts = 2;

  const target = 'https://web.whatsapp.com';
  const proxyUrl = useMemo(() => {
    return '/api/webproxy?url=' + encodeURIComponent(target);
  }, [target, reloadKey]);

  const healthUrl = useMemo(() => {
    return '/api/webproxy/health?url=' + encodeURIComponent(target);
  }, [target, reloadKey]);

  useEffect(() => {
    let alive = true;

    async function pollHealth() {
      try {
        const res = await fetch(healthUrl, { cache: 'no-store' });
        const data = await res.json();
        if (!alive) return;

        if (data?.ok) {
          // Visual: don't block UI when WA is already showing in iframe.
          setStatus('');
          return;
        }

        if (attempt < maxAttempts) {
          setAttempt((v) => v + 1);
          setReloadKey((v) => v + 1);
          return;
        }

        setStatus('WhatsApp pode estar bloqueando este ambiente.');
      } catch {
        if (!alive) return;
        if (attempt < maxAttempts) {
          setAttempt((v) => v + 1);
          setReloadKey((v) => v + 1);
          return;
        }
        setStatus('Falha ao verificar conexão do WebProxy.');
      }
    }

    const interval = window.setInterval(pollHealth, 6000);
    pollHealth();

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [healthUrl, attempt]);

  const handleFrameLoad = () => {
    // Always show the iframe immediately; no blocking overlay.
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
      {!!status && (
        <div className="px-4 py-2 text-sm bg-amber-50 text-amber-900 border-b border-amber-200 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-900/40">
          {status}
        </div>
      )}
      <div className="relative flex-1 bg-zinc-100 dark:bg-zinc-950">
        <iframe
          key={proxyUrl}
          src={proxyUrl}
          ref={iframeRef}
          className="w-full h-full border-none"
          onLoad={handleFrameLoad}
          allow="autoplay; camera; microphone; clipboard-read; clipboard-write;"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}
