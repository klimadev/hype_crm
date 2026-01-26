'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  History,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductReminder, ReminderLog } from '@/types';
import { MessageVariablesHelper } from '@/components/reminders/MessageVariablesHelper';
import { MessagePreview } from '@/components/reminders/MessagePreview';
import { InstanceSelector } from '@/components/reminders/InstanceSelector';

interface Stage {
  id: number;
  name: string;
  color: string;
}

interface Instance {
  name: string;
  profileName?: string;
  ownerJid?: string;
  connectionStatus: string;
}

interface ReminderStats {
  pending: number;
  sent_today: number;
  next_reminder: {
    lead_name: string;
    product_name: string;
    time_remaining: string;
    message_preview: string;
  } | null;
}

const formatDelay = (value: number, unit: string) => {
  const unitLabel = unit === 'minute' ? 'minuto(s)' : unit === 'hour' ? 'hora(s)' : unit === 'day' ? 'dia(s)' : unit === 'month' ? 'mês(es)' : unit;
  return `${value} ${unitLabel}`;
};

export default function ProductRemindersPage() {
  const params = useParams();
  const productId = parseInt(params.id as string);

  const [reminders, setReminders] = useState<ProductReminder[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ProductReminder | null>(null);
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<ReminderLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [formData, setFormData] = useState({
    stage_id: '',
    delay_value: '1',
    delay_unit: 'day',
    reminder_mode: 'once' as 'once' | 'recurring',
    instance_name: '',
    message: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      const [remindersRes, stagesRes, statusRes, instancesRes] = await Promise.all([
        fetch(`/api/products/${productId}/reminders`),
        fetch('/api/stages'),
        fetch(`/api/products/${productId}/reminders/status`),
        fetch('/api/instances'),
      ]);

      const remindersData = await remindersRes.json();
      const stagesData = await stagesRes.json();
      const statusData = await statusRes.json();
      const instancesData = await instancesRes.json();

      setReminders(remindersData);
      setStages(stagesData);
      setStats(statusData.stats);
      setRecentLogs(statusData.recent_logs || []);
      setInstances(instancesData);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const getStageName = (stageId: number) => {
    const stage = stages.find(s => s.id === stageId);
    return stage?.name || 'Estágio desconhecido';
  };

  const getStageColor = (stageId: number) => {
    const stage = stages.find(s => s.id === stageId);
    return stage?.color || '#6366f1';
  };

  const getInstanceStatus = (instanceName: string | null | undefined) => {
    if (!instanceName) return null;
    const instance = instances.find(i => i.name === instanceName);
    return instance;
  };

  const isInstanceConnected = (instanceName: string | null | undefined) => {
    if (!instanceName) return false;
    const instance = instances.find(i => i.name === instanceName);
    return instance?.connectionStatus === 'connected';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm"><CheckCircle2 className="w-3 h-3" /> Enviado</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-sm"><AlertCircle className="w-3 h-3" /> Falhou</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-sm"><XCircle className="w-3 h-3" /> Cancelado</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm"><Clock className="w-3 h-3" /> Pendente</span>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!formData.instance_name) {
      setError('Selecione uma instância do WhatsApp para este lembrete.');
      setSaving(false);
      return;
    }

    if (!isInstanceConnected(formData.instance_name)) {
      setError('A instância selecionada não está conectada. Escolha uma instância conectada.');
      setSaving(false);
      return;
    }

    try {
      const method = editingReminder ? 'PUT' : 'POST';
      const url = editingReminder
        ? `/api/products/${productId}/reminders/${editingReminder.id}`
        : `/api/products/${productId}/reminders`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_id: parseInt(formData.stage_id),
          delay_value: parseInt(formData.delay_value),
          delay_unit: formData.delay_unit,
          reminder_mode: formData.reminder_mode,
          instance_name: formData.instance_name,
          message: formData.message,
          is_active: formData.is_active,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save reminder');
      }

      await fetchData();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error('Erro ao salvar lembrete:', err);
      setError('Erro ao salvar lembrete. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (reminder: ProductReminder) => {
    setEditingReminder(reminder);
    setFormData({
      stage_id: reminder.stage_id.toString(),
      delay_value: reminder.delay_value.toString(),
      delay_unit: reminder.delay_unit,
      reminder_mode: reminder.reminder_mode as 'once' | 'recurring',
      instance_name: reminder.instance_name || '',
      message: reminder.message,
      is_active: Boolean(reminder.is_active),
    });
    setShowForm(true);
  };

  const handleDelete = async (reminderId: number) => {
    if (!confirm('Tem certeza que deseja excluir este lembrete?')) return;

    try {
      const res = await fetch(`/api/products/${productId}/reminders/${reminderId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Erro ao excluir lembrete:', err);
    }
  };

  const triggerJobNow = async () => {
    try {
      const res = await fetch('/api/recurrence/check');
      const data = await res.json();
      console.log('Job resultado:', data);
      alert(`Job executado! Processados: ${data.processed}, Sucessos: ${data.success}, Falhas: ${data.failed}`);
      await fetchData();
    } catch (err) {
      console.error('Erro ao executar job:', err);
      alert('Erro ao executar job');
    }
  };

  const formatDateLocal = (dateValue: string | number | null) => {
    if (!dateValue) return '-';
    let date: Date;
    if (typeof dateValue === 'number') {
      date = new Date(dateValue * 1000);
    } else {
      date = new Date(dateValue);
    }
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const resetForm = () => {
    setEditingReminder(null);
    setFormData({
      stage_id: '',
      delay_value: '1',
      delay_unit: 'day',
      reminder_mode: 'once',
      instance_name: '',
      message: '',
      is_active: true,
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const handleInsertVariable = useCallback((variable: string) => {
    setFormData((prev) => ({
      ...prev,
      message: prev.message + variable,
    }));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/products/${productId}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Voltar
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            Histórico
          </button>
          <button
            onClick={triggerJobNow}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
            title="Executar job de lembretes manualmente"
          >
            <RefreshCw className="w-4 h-4" />
            Testar Job
          </button>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Lembrete
            </button>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Lembretes</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Configure lembretes automáticos para este produto
        </p>
      </motion.div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Enviados hoje</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats.sent_today}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Próximo lembrete</span>
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white mt-1">
              {stats.next_reminder ? `${stats.next_reminder.lead_name} (${stats.next_reminder.time_remaining})` : 'Nenhum'}
            </p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showLogs ? (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/50">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Histórico de Lembretes</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {recentLogs.length === 0 ? (
                <div className="p-12 text-center">
                  <History className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-500 dark:text-zinc-400">Nenhum registro ainda</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Lead</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Mensagem</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Agendado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-3 text-sm text-zinc-900 dark:text-white">{log.lead_name || `Lead ${log.lead_id}`}</td>
                        <td className="px-6 py-3 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate">{log.message_preview || '-'}</td>
                        <td className="px-6 py-3">{getStatusBadge(log.status)}</td>
                        <td className="px-6 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                          {formatDateLocal(log.scheduled_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        ) : showForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800/50"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
              {editingReminder ? 'Editar Lembrete' : 'Novo Lembrete'}
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                  Estágio que dispara *
                </label>
                <select
                  value={formData.stage_id}
                  onChange={(e) => setFormData({ ...formData, stage_id: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="">Selecione um estágio</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                    Valor *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.delay_value}
                    onChange={(e) => setFormData({ ...formData, delay_value: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                    Unidade *
                  </label>
                  <select
                    value={formData.delay_unit}
                    onChange={(e) => setFormData({ ...formData, delay_unit: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="minute">Minuto(s)</option>
                    <option value="hour">Hora(s)</option>
                    <option value="day">Dia(s)</option>
                    <option value="week">Semana(s)</option>
                    <option value="month">Mês(es)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                  Tipo de Lembrete *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, reminder_mode: 'once' })}
                    className={`px-4 py-3 rounded-xl border transition-all ${
                      formData.reminder_mode === 'once'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Bell className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Único</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, reminder_mode: 'recurring' })}
                    className={`px-4 py-3 rounded-xl border transition-all ${
                      formData.reminder_mode === 'recurring'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <RefreshCw className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Recorrente</span>
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
                  {formData.reminder_mode === 'once' 
                    ? 'Envia apenas uma vez quando o lead entrar no estágio' 
                    : 'Envia repetidamente com o intervalo configurado'}
                </p>
              </div>

              <div className="space-y-1.5">
                <InstanceSelector
                  instances={instances}
                  value={formData.instance_name}
                  onChange={(value) => setFormData({ ...formData, instance_name: value })}
                  error={error || undefined}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                  Mensagem *
                </label>
                <MessageVariablesHelper onInsertVariable={handleInsertVariable} />
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <MessageSquare className="h-5 w-5 text-zinc-400" />
                  </div>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    rows={4}
                    placeholder="Olá {{leadName}}, já faz algum tempo desde seu último atendimento! Que tal agendar um novo horário?"
                    required
                  />
                </div>
                <MessagePreview
                  message={formData.message}
                  leadName="João Silva"
                  leadPhone="(11) 99999-9999"
                  productName="Nome do Produto"
                  stageName="Estágio Atual"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Lembrete ativo
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      {editingReminder ? 'Atualizar' : 'Criar Lembrete'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {reminders.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900/30 rounded-2xl p-12 border border-zinc-100 dark:border-zinc-800/50 text-center">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  Nenhum lembrete configurado
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">
                  Comece criando lembretes automáticos para notificar clientes quando eles entrarem em estágios específicos.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Criar Primeiro Lembrete
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800/50">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Estágio
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Tempo
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Instância
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Mensagem
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {reminders.map((reminder) => {
                      const connected = isInstanceConnected(reminder.instance_name);
                      return (
                        <tr key={reminder.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getStageColor(reminder.stage_id) }}
                              />
                              <span className="font-medium text-zinc-900 dark:text-white">
                                {getStageName(reminder.stage_id)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {formatDelay(reminder.delay_value, reminder.delay_unit)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {reminder.instance_name ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                  {reminder.instance_name}
                                </span>
                                {connected ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <span title="Instância desconectada">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-zinc-400 dark:text-zinc-500">
                                Não configurada
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {reminder.reminder_mode === 'recurring' ? (
                              <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 text-sm">
                                <RefreshCw className="w-4 h-4" />
                                Recorrente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400 text-sm">
                                <Bell className="w-4 h-4" />
                                Único
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {reminder.is_active && reminder.instance_name && connected ? (
                              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                Ativo
                              </span>
                            ) : reminder.is_active && reminder.instance_name && !connected ? (
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm" title="Instância desconectada">
                                <AlertCircle className="w-4 h-4" />
                                Instância off
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-sm">
                                <XCircle className="w-4 h-4" />
                                Inativo
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md truncate">
                              {reminder.message}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(reminder)}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(reminder.id)}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-zinc-500 hover:text-red-600"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
