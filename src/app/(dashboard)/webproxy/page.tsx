
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ActiveChatPayload = {
  chatId: string | null;
  chatName?: string | null;
};

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timeoutId: number;
};

type BridgeStatus = {
  wppReady: boolean;
  hasWpp: boolean;
  hasChat: boolean;
  hasGetActiveChat: boolean;
  hasGetActiveChatId: boolean;
  hasGetChatById: boolean;
  hasChatStore: boolean;
  hasLegacyStore: boolean;
  lastActiveChatId: string | null;
  timestamp: number;
};

type ManualCheckState = {
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  timestamp: number | null;
};

export default function WebProxyPage() {
  const [status, setStatus] = useState('');
  const [wppReady, setWppReady] = useState(false);
  const [activeChat, setActiveChat] = useState<ActiveChatPayload | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [isCheckingChat, setIsCheckingChat] = useState(false);
  const [manualCheck, setManualCheck] = useState<ManualCheckState>({
    status: 'idle',
    message: 'Sem checagem manual ainda.',
    timestamp: null,
  });

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const pendingRequestsRef = useRef<Map<string, PendingRequest>>(new Map());
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

  useEffect(() => {
    setWppReady(false);
    setActiveChat(null);
  }, [reloadKey]);

  const sendWaCommand = useCallback(
    (action: string, args: unknown[] = [], timeoutMs = 5000) => {
      return new Promise((resolve, reject) => {
        const iframeWindow = iframeRef.current?.contentWindow;
        if (!iframeWindow) {
          reject(new Error('Iframe nao encontrado.'));
          return;
        }

        const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const timeoutId = window.setTimeout(() => {
          pendingRequestsRef.current.delete(requestId);
          reject(new Error('Timeout ao executar comando no WhatsApp.'));
        }, timeoutMs);

        pendingRequestsRef.current.set(requestId, { resolve, reject, timeoutId });

        iframeWindow.postMessage(
          {
            type: 'wa:exec',
            version: 1,
            requestId,
            payload: {
              action,
              args,
            },
          },
          '*',
        );
      });
    },
    [],
  );

  const executeWaScript = useCallback(async (code: string, timeoutMs = 7000) => {
    const response = await fetch('/api/webproxy/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'execute', code }),
    });
    const data = await response.json();
    const commandId = data?.id as string | undefined;
    if (!commandId) {
      throw new Error('Falha ao enviar comando via API.');
    }

    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const controller = new AbortController();
      const abortTimer = window.setTimeout(() => controller.abort(), 2000);
      let resultData: { result?: { result?: string; error?: boolean } } | null = null;
      try {
        const resultRes = await fetch(`/api/webproxy/command?command_id=${commandId}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        resultData = await resultRes.json();
      } catch {
      } finally {
        window.clearTimeout(abortTimer);
      }
      if (resultData?.result) {
        if (resultData.result.error) {
          throw new Error(resultData.result.result || 'Erro ao executar comando no WhatsApp.');
        }
        return resultData.result.result as string;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error('Timeout aguardando retorno do WhatsApp.');
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const isSameSource = event.source === iframeRef.current?.contentWindow;
      const isSameOrigin = event.origin === window.location.origin;
      if (!isSameSource && !isSameOrigin) return;
      const data = event.data as
        | { type?: string; payload?: ActiveChatPayload; requestId?: string }
        | { type?: string; payload?: { error?: boolean; result?: unknown; message?: string }; requestId?: string }
        | null;
      if (!data?.type) return;

      if (data.type === 'wa:ready' || data.type === 'wpp-ready') {
        setWppReady(true);
        return;
      }

      if (data.type === 'wa:active-chat') {
        setWppReady(true);
        const payload = data.payload as ActiveChatPayload | undefined;
        setActiveChat(payload || null);
      }

      if (data.type === 'wa:bridge-loaded') {
        // ignore debug signals
      }

      if (data.type === 'wa:bridge-load-ok') {
        // ignore debug signals
      }

      if (data.type === 'wa:bridge-load-error') {
        // ignore debug signals
      }

      if (data.type === 'wa:wpp-load-ok') {
        // ignore debug signals
      }

      if (data.type === 'wa:wpp-load-error') {
        // ignore debug signals
      }

      if (data.type === 'wa:inject') {
        // ignore debug signals
      }

      if (data.type === 'wa:bridge-status') {
        const payload = data.payload as BridgeStatus | undefined;
        if (payload) {
          setBridgeStatus(payload);
          if (payload.wppReady) setWppReady(true);
        }
      }

      if (data.type === 'wa:result' && data.requestId) {
        const pending = pendingRequestsRef.current.get(data.requestId);
        if (!pending) return;
        pendingRequestsRef.current.delete(data.requestId);
        window.clearTimeout(pending.timeoutId);
        const payload = data.payload as { error?: boolean; result?: unknown; message?: string } | undefined;
        if (payload?.error) {
          pending.reject(new Error(payload.message || 'Erro ao executar comando no WhatsApp.'));
        } else {
          pending.resolve(payload?.result ?? null);
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    if (!wppReady) return;
    let cancelled = false;

    sendWaCommand('get-active-chat')
      .then((result) => {
        if (cancelled || !result) return;
        const payload = result as ActiveChatPayload;
        setActiveChat(payload);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [sendWaCommand, wppReady]);

  const handleManualCheck = useCallback(async () => {
    if (isCheckingChat) return;
    setIsCheckingChat(true);
    setManualCheck({
      status: 'running',
      message: 'Executando script via API...',
      timestamp: Date.now(),
    });
    try {
      const code = `
        const chat = await (WPP?.chat?.getActiveChat?.() ?? null);
        const id = chat?.id?._serialized ?? chat?.id ?? null;
        const name = chat?.name ?? chat?.formattedTitle ?? chat?.title ?? null;
        return JSON.stringify({ chatId: id ? String(id) : null, chatName: name ? String(name) : null });
      `;
      const result = await executeWaScript(code);
      if (result) {
        try {
          const parsed = JSON.parse(result) as ActiveChatPayload;
          setActiveChat(parsed);
          setManualCheck({
            status: 'success',
            message: `Resultado: ${result}`,
            timestamp: Date.now(),
          });
        } catch {
          setActiveChat({ chatId: result, chatName: null });
          setManualCheck({
            status: 'success',
            message: `Resultado: ${result}`,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao executar script.';
      setManualCheck({ status: 'error', message, timestamp: Date.now() });
    } finally {
      setIsCheckingChat(false);
    }
  }, [executeWaScript, isCheckingChat]);

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
      <div className="border-b border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              WebProxy Status
            </div>
            <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {!wppReady && 'Aguardando WhatsApp...'}
              {wppReady && !activeChat?.chatId && 'Nenhum chat ativo'}
              {wppReady && activeChat?.chatId && `Chat ativo: ${activeChat.chatId}`}
            </div>
            {wppReady && activeChat?.chatName && (
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {activeChat.chatName}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleManualCheck}
            disabled={isCheckingChat}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {isCheckingChat ? 'Checando...' : 'Checar agora'}
          </button>
        </div>
      </div>
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
