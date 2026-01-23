import { useState, useEffect } from 'react';

interface Reminder {
  id: number;
  lead_id: number;
  product_id: number;
  type: string;
  status: string;
  trigger_type: string;
  trigger_value: string;
  message: string;
  instance_name: string;
  scheduled_at: number;
  sent_at: number | null;
  error: string | null;
  created_at: number;
}

export function useReminders(leadId?: number, productId?: number) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = async () => {
    try {
      const params = new URLSearchParams();
      if (leadId) params.append('leadId', leadId.toString());
      if (productId) params.append('productId', productId.toString());

      const response = await fetch(`/api/reminders?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setReminders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async (data: {
    leadId: number;
    productId?: number;
    message: string;
    instanceName: string;
    scheduledAt: number;
  }) => {
    const response = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...data }),
    });
    if (!response.ok) throw new Error('Failed to create');
    await fetchReminders();
  };

  const updateStatus = async (id: number, status: string) => {
    const response = await fetch('/api/reminders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (!response.ok) throw new Error('Failed to update');
    await fetchReminders();
  };

  const deleteReminder = async (id: number) => {
    const response = await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete');
    await fetchReminders();
  };

  const sendNow = async (id: number) => {
    const response = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send-now', reminderId: id }),
    });
    if (!response.ok) throw new Error('Failed to send');
    await fetchReminders();
  };

  useEffect(() => {
    fetchReminders();
  }, [leadId, productId]);

  return {
    reminders,
    loading,
    error,
    createReminder,
    updateStatus,
    deleteReminder,
    sendNow,
    refetch: fetchReminders,
  };
}