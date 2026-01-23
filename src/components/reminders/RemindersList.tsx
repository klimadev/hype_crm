'use client';

import { useState } from 'react';
import { Calendar, Clock, Send, Edit2, Trash2, Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ReminderService, STATUS_CONFIG } from '@/lib/services/reminder.service';

interface ScheduledReminder {
  id: number;
  lead_id: number;
  product_id: number | null;
  reminder_id: number | null;
  message: string;
  instance_name: string;
  scheduled_at: number;
  status: string;
  sent_at: number | null;
  error: string | null;
  is_manual: number;
  created_at: number;
  product_name: string | null;
}

interface ReminderLog {
  id: number;
  lead_id: number;
  product_id: number;
  scheduled_at: string;
  sent_at: string | null;
  status: string;
  message_preview: string | null;
  error: string | null;
  is_manual: number;
  created_at: string;
  product_name: string | null;
}

interface RemindersListProps {
  leadId: number;
  leadName: string;
  scheduledReminders: ScheduledReminder[];
  logs: ReminderLog[];
  onRefresh: () => void;
  onEdit: (reminder: ScheduledReminder) => void;
  onDelete: (id: number) => void;
  onSendNow: (id: number) => void;
}



export function RemindersList({
  leadId,
  leadName,
  scheduledReminders,
  logs,
  onRefresh,
  onEdit,
  onDelete,
  onSendNow,
}: RemindersListProps) {
  const [sendingNow, setSendingNow] = useState<number | null>(null);

  const formatDateTime = (timestamp: number | string | null) => {
    if (!timestamp) return '-';
    return ReminderService.formatReminderDate(timestamp, { includeTime: true });
  };

  const handleSendNow = async (id: number) => {
    setSendingNow(id);
    try {
      await onSendNow(id);
    } finally {
      setSendingNow(null);
    }
  };

  const pendingCount = scheduledReminders.filter((r) => r.status === 'pending').length;
  const maxPending = 5;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-zinc-400" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Agendamentos
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            pendingCount >= maxPending
              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
          }`}>
            {pendingCount}/{maxPending}
          </span>
        </div>
      </div>

      {scheduledReminders.length > 0 ? (
        <div className="space-y-3">
          {scheduledReminders.map((reminder) => {
            const config = ReminderService.getStatusConfig(reminder.status);
            const Icon = config.color === 'yellow' ? Clock :
                         config.color === 'green' ? CheckCircle :
                         config.color === 'red' ? AlertCircle :
                         config.color === 'gray' ? XCircle : Clock;

            return (
              <div
                key={reminder.id}
                className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDateTime(reminder.scheduled_at)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-900 dark:text-white line-clamp-2 mb-2">
                      {reminder.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Send className="w-3 h-3" />
                        {reminder.instance_name}
                      </span>
                      {reminder.product_name && (
                        <span>{reminder.product_name}</span>
                      )}
                      {reminder.status === 'sent' && reminder.sent_at && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Enviado: {formatDateTime(reminder.sent_at)}
                        </span>
                      )}
                      {reminder.status === 'failed' && reminder.error && (
                        <span className="text-red-600 dark:text-red-400 truncate">
                          {reminder.error}
                        </span>
                      )}
                    </div>
                  </div>

                  {reminder.status === 'pending' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(reminder)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Reagendar"
                      >
                        <Edit2 className="w-4 h-4 text-zinc-500" />
                      </button>
                      <button
                        onClick={() => handleSendNow(reminder.id)}
                        disabled={sendingNow === reminder.id}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Enviar agora"
                      >
                        {sendingNow === reminder.id ? (
                          <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 text-zinc-500" />
                        )}
                      </button>
                      <button
                        onClick={() => onDelete(reminder.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Cancelar"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum agendamento</p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Histórico de Envios
          </h4>
          <div className="space-y-2">
            {logs.slice(0, 10).map((log) => {
              const logConfig = ReminderService.getStatusConfig(log.status);
              const Icon = logConfig.color === 'yellow' ? Clock :
                           logConfig.color === 'green' ? CheckCircle :
                           logConfig.color === 'red' ? AlertCircle :
                           logConfig.color === 'gray' ? XCircle : Clock;

              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                >
                  <Icon className={`w-4 h-4 text-${logConfig.color}-600 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-900 dark:text-white truncate">
                      {log.message_preview || '-'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{formatDateTime(log.scheduled_at)}</span>
                      {log.product_name && <span>• {log.product_name}</span>}
                      {log.is_manual === 1 && <span className="text-indigo-500">• Manual</span>}
                    </div>
                  </div>
                  <span className={`text-xs text-${logConfig.color}-600`}>
                    {log.status === 'sent' ? 'Enviado' : log.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
