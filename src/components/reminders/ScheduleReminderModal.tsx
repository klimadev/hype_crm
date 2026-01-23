'use client';

import { useState, useEffect } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { ReminderService } from '@/lib/services/reminder.service';

interface Instance {
  name: string;
  status: string;
}



interface ScheduleReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leadId: number;
  leadName: string;
}

export function ScheduleReminderModal({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  leadName,
}: ScheduleReminderModalProps) {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchInstances = async () => {
      try {
        const res = await fetch('/api/instances');
        if (res.ok) {
          const data = await res.json();
          setInstances(data || []);
          if (data && data.length > 0) {
            const connected = data.find((i: Instance) => i.status === 'connected');
            setInstanceName(connected?.name || data[0].name);
          }
        }
      } catch (err) {
        console.error('Error fetching instances:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInstances();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !scheduledDate) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().slice(0, 5);
      setScheduledDate(dateStr);
      setScheduledTime(timeStr);
    }
  }, [isOpen, scheduledDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!message.trim()) {
      setError('A mensagem é obrigatória');
      return;
    }

    if (!instanceName) {
      setError('Selecione uma instância');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      setError('Selecione data e hora');
      return;
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledAt <= new Date()) {
      setError('A data/hora deve ser futura');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/leads/${leadId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          instance_name: instanceName,
          scheduled_at: scheduledAt.toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar agendamento');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setScheduledDate('');
    setScheduledTime('');
    setError(null);
    onClose();
  };

  const handleInsertVariable = (variable: string) => {
    setMessage((prev) => prev + variable);
  };

  if (!isOpen) return null;

  const preview = ReminderService.resolveMessageTemplate(message, {
    leadName,
    leadPhone: '',
    productName: '',
    stageName: ''
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Agendar Lembrete
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Data do Agendamento
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Horário
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Instância WhatsApp
            </label>
            <select
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {loading && <option>Carregando...</option>}
              {!loading && instances.length === 0 && (
                <option>Nenhuma instância disponível</option>
              )}
              {instances.map((inst) => (
                <option key={inst.name} value={inst.name}>
                  {inst.name} ({inst.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Mensagem
              </label>
              <div className="flex gap-1">
                {['{{leadName}}'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleInsertVariable(v)}
                    className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors text-zinc-600 dark:text-zinc-400"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Digite sua mensagem..."
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
          </div>

          {message && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-2 uppercase tracking-wide">
                Prévia
              </p>
              <p className="text-sm text-zinc-900 dark:text-white whitespace-pre-wrap">
                {preview}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 border border-transparent"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Agendar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
