'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { X, Loader2, RefreshCw, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { EvolutionInstance } from '@/lib/evolution/types';

interface QrCodeModalProps {
  instance: EvolutionInstance;
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export function QrCodeModal({ instance, isOpen, onClose, onConnected }: QrCodeModalProps) {
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [connectionState, setConnectionState] = useState<string>('unknown');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const hasQrcodeRef = useRef(false);

  const fetchQrCode = useCallback(async () => {
    try {
      const response = await fetch(`/api/instances/${instance.name}/connect`);

      if (!response.ok) {
        if (response.status === 401 || response.status === 302) {
          setErrorMessage('Sessão expirada. Faça login novamente.');
          setStatus('error');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      setConnectionState(data.connectionState || 'unknown');

      if (data.qrcode) {
        setQrcode(data.qrcode);
        hasQrcodeRef.current = true;
        setStatus('ready');
      }

      if (data.connectionState === 'open' || data.status === 'connected') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        onConnected();
        onClose();
        return;
      }

      if (!data.qrcode && hasQrcodeRef.current) {
        hasQrcodeRef.current = false;
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      setErrorMessage('Erro ao conectar com a API. Tentando novamente...');
      setStatus('error');
    }
  }, [instance.name, onConnected, onClose]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(() => {
      fetchQrCode();
    }, 3000);
  }, [fetchQrCode]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopPolling();
      return;
    }

    setStatus('loading');
    setErrorMessage('');
    hasQrcodeRef.current = false;

    if (instance.qrcode) {
      setQrcode(instance.qrcode);
      setStatus('ready');
      hasQrcodeRef.current = true;
    }

    fetchQrCode().then(() => {
      startPolling();
    });

    return () => {
      stopPolling();
    };
  }, [isOpen, instance.name, instance.qrcode, fetchQrCode, startPolling, stopPolling]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Conectar WhatsApp
            </h2>
          </div>
          <button
            onClick={() => {
              stopPolling();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center">
            {connectionState === 'open' || connectionState === 'connected' ? (
              <div className="py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-green-600 dark:text-green-400 font-medium mb-2">
                  Conectado com sucesso!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  O WhatsApp está pronto para uso.
                </p>
                <button
                  onClick={() => {
                    stopPolling();
                    onClose();
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Abra o WhatsApp no seu celular, vá em{' '}
                  <strong>Configurações → Dispositivos Vinculados → Vincular um dispositivo</strong>{' '}
                  e escaneie o QR Code abaixo.
                </p>

                {status === 'loading' && !qrcode && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                    <p className="text-sm text-gray-500">Carregando QR Code...</p>
                  </div>
                )}

                {status === 'error' && (
                  <div className="py-6">
                    <AlertCircle className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                    <p className="text-orange-600 dark:text-orange-400 mb-4">{errorMessage}</p>
                    <button
                      onClick={() => {
                        setStatus('loading');
                        fetchQrCode();
                        startPolling();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Tentar novamente
                    </button>
                  </div>
                )}

                {status === 'ready' && qrcode && (
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-white rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm">
                      <img
                        src={qrcode}
                        alt="QR Code para conectar WhatsApp"
                        className="w-64 h-64"
                      />
                    </div>
                    <p className="mt-4 text-xs text-gray-500">
                      QR Code atualizado automaticamente
                    </p>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <span className={`w-2 h-2 rounded-full ${status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></span>
                  {status === 'ready' ? 'Pronto para escanear' : 'Atualizando...'}
                </div>

                {connectionState === 'disconnected' && (
                  <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      A conexão foi perdida. Escaneie o QR Code novamente.
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500">
                    Instância: <strong>{instance.name}</strong>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
