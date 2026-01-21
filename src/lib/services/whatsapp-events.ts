import { query, getOne, run } from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';
import { resolveTemplate } from '@/lib/whatsapp/templates';

const MOCK_MODE = process.env.WHATSAPP_MOCK === 'true';

interface WhatsAppEvent {
  id: number;
  name: string;
  product_id: number | null;
  trigger_type: string;
  stage_id: number;
  timeout_minutes: number | null;
  message_template: string;
  is_active: number;
}

interface LeadInfo {
  id: number;
  name: string;
  phone: string;
  product_id: number | null;
  stage_id: number;
  product_name?: string;
  instance_name?: string;
  stage_name?: string;
}

interface SentMessage {
  id: number;
  lead_id: number;
  event_id: number;
  sent_at: string;
}

export async function handleStageEntry(leadId: number, stageId: number): Promise<void> {
  console.log(`[WhatsApp Events] 🎯 handleStageEntry called: leadId=${leadId}, stageId=${stageId}`);

  const events = await query<WhatsAppEvent>(`
    SELECT * FROM whatsapp_events
    WHERE trigger_type = 'stage_entry'
    AND stage_id = ?
    AND is_active = 1
  `, [stageId]);

  console.log(`[WhatsApp Events] 📊 Found ${events.length} legacy events for stage ${stageId}`);

  for (const event of events) {
    console.log(`[WhatsApp Events] 📋 Processing legacy event: "${event.name}" (id=${event.id})`);
    await processEvent(event, leadId);
  }

  const reminders = await query<{
    id: number;
    product_id: number;
    delay_value: number;
    delay_unit: string;
    reminder_mode: string;
    instance_name: string | null;
    message: string;
  }>(`
    SELECT pr.id, pr.product_id, pr.delay_value, pr.delay_unit, pr.reminder_mode, pr.instance_name, pr.message
    FROM product_reminders pr
    INNER JOIN leads l ON l.product_id = pr.product_id
    WHERE pr.stage_id = ?
    AND pr.is_active = 1
    AND l.id = ?
  `, [stageId, leadId]);

  console.log(`[WhatsApp Events] 📊 Found ${reminders.length} product reminders for stage ${stageId}, lead ${leadId}`);

  for (const reminder of reminders) {
    console.log(`[WhatsApp Events] 📋 Processing reminder: id=${reminder.id}, product=${reminder.product_id}`);

    const nextDate = new Date();
    switch (reminder.delay_unit) {
      case 'minute':
        nextDate.setMinutes(nextDate.getMinutes() + reminder.delay_value);
        break;
      case 'hour':
        nextDate.setHours(nextDate.getHours() + reminder.delay_value);
        break;
      case 'day':
        nextDate.setDate(nextDate.getDate() + reminder.delay_value);
        break;
      case 'week':
        nextDate.setDate(nextDate.getDate() + reminder.delay_value * 7);
        break;
      case 'month':
        nextDate.setMonth(nextDate.getMonth() + reminder.delay_value);
        break;
    }

    const nextReminderDate = Math.floor(nextDate.getTime() / 1000);

    const existingTracker = await getOne(
      'SELECT id FROM lead_recurrence_tracker WHERE lead_id = ? AND product_id = ?',
      [leadId, reminder.product_id]
    );

    if (existingTracker) {
      await run(
        `UPDATE lead_recurrence_tracker SET cycle_count = cycle_count + 1, last_service_date = unixepoch(), next_reminder_date = ? WHERE lead_id = ? AND product_id = ?`,
        [nextReminderDate, leadId, reminder.product_id]
      );
    } else {
      await run(
        `INSERT INTO lead_recurrence_tracker (lead_id, product_id, last_service_date, next_reminder_date, cycle_count) VALUES (?, ?, unixepoch(), ?, 1)`,
        [leadId, reminder.product_id, nextReminderDate]
      );
    }

    await logReminderPending(
      leadId,
      reminder.product_id,
      reminder.id,
      nextReminderDate,
      reminder.message
    );

    console.log(`[WhatsApp Events] ✅ Reminder scheduled for ${nextReminderDate}`);
  }

  console.log(`[WhatsApp Events] ✅ handleStageEntry completed`);
}

export async function handleStageTimeout(leadId: number, stageId: number, timeoutMinutes: number): Promise<void> {
  const events = await query<WhatsAppEvent>(`
    SELECT * FROM whatsapp_events
    WHERE trigger_type = 'stage_timeout'
    AND stage_id = ?
    AND is_active = 1
    AND timeout_minutes = ?
  `, [stageId, timeoutMinutes]);

  for (const event of events) {
    await processEvent(event, leadId);
  }
}

async function processEvent(event: WhatsAppEvent, leadId: number): Promise<void> {
  console.log(`[WhatsApp Events] 🔄 processEvent: event="${event.name}", leadId=${leadId}`);

  const lead = await getOne<LeadInfo>(`
    SELECT l.*, p.name as product_name, p.instance_name, s.name as stage_name
    FROM leads l
    LEFT JOIN products p ON l.product_id = p.id
    LEFT JOIN stages s ON l.stage_id = s.id
    WHERE l.id = ?
  `, [leadId]);

  if (!lead) {
    console.error(`[WhatsApp Events] ❌ Lead ${leadId} not found`);
    return;
  }

  console.log(`[WhatsApp Events] 👤 Lead info: name="${lead.name}", phone="${lead.phone}", product="${lead.product_name}", instance="${lead.instance_name}"`);

  const message = resolveTemplate(event.message_template, {
    leadName: lead.name,
    leadPhone: lead.phone,
    productName: lead.product_name || '',
    stageName: lead.stage_name || '',
  });

  console.log(`[WhatsApp Events] 📝 Resolved message: "${message.substring(0, 50)}..."`);

  const wasAlreadySent = await wasMessageSent(leadId, event.id);
  if (wasAlreadySent) {
    console.log(`[WhatsApp Events] ⏭️ Message for event "${event.name}" already sent to lead ${leadId}, skipping`);
    return;
  }

  console.log(`[WhatsApp Events] 📤 Sending WhatsApp message to ${lead.phone}...`);

  if (MOCK_MODE) {
    console.log(`[MOCK] 📱 WhatsApp enviado para ${lead.phone}: "${message.substring(0, 50)}..."`);
    await recordSentMessage(leadId, event.id);
    console.log(`[MOCK] ✅ Mensagem mockada registrada para lead ${leadId}`);
  } else {
    const result = await sendWhatsAppMessage({
      instanceName: lead.instance_name || process.env.EVOLUTION_INSTANCE_NAME || 'teste2',
      phone: lead.phone,
      message,
    });

    if (result.success) {
      await recordSentMessage(leadId, event.id);
      console.log(`[WhatsApp Events] ✅ WhatsApp message sent to ${lead.phone} for event "${event.name}"`);
    } else {
      console.error(`[WhatsApp Events] ❌ Failed to send WhatsApp message for event "${event.name}" to ${lead.phone}: ${result.error}`);
    }
  }
}

async function wasMessageSent(leadId: number, eventId: number): Promise<boolean> {
  const existing = await getOne<{ id: number }>(
    `SELECT id FROM sent_whatsapp_messages WHERE lead_id = ? AND event_id = ?`,
    [leadId, eventId]
  );
  return existing !== null;
}

async function recordSentMessage(leadId: number, eventId: number): Promise<void> {
  try {
    await run(
      `INSERT INTO sent_whatsapp_messages (lead_id, event_id) VALUES (?, ?)`,
      [leadId, eventId]
    );
  } catch (error) {
    console.error('Failed to record sent message:', error);
  }
}

export async function logReminderSent(
  leadId: number,
  productId: number,
  reminderId: number,
  message: string,
  nextScheduledAt: number | null
): Promise<void> {
  try {
    const existingPending = await getOne<{ id: number }>(
      `SELECT id FROM reminder_logs 
       WHERE lead_id = ? AND product_id = ? AND reminder_id = ? AND status = 'pending'
       ORDER BY id DESC LIMIT 1`,
      [leadId, productId, reminderId]
    );

    if (existingPending) {
      await run(
        `UPDATE reminder_logs SET 
          status = 'sent', 
          sent_at = unixepoch(), 
          message_preview = ?,
          next_scheduled_at = ?
        WHERE id = ?`,
        [message.substring(0, 100), nextScheduledAt, existingPending.id]
      );
      console.log(`[Reminder Logs] ✅ Updated reminder log to sent for lead ${leadId}`);
    } else {
      await run(
        `INSERT INTO reminder_logs (lead_id, product_id, reminder_id, scheduled_at, sent_at, status, message_preview, next_scheduled_at) 
         VALUES (?, ?, ?, unixepoch(), unixepoch(), 'sent', ?, ?)`,
        [leadId, productId, reminderId, message.substring(0, 100), nextScheduledAt]
      );
      console.log(`[Reminder Logs] ✅ Logged new reminder sent for lead ${leadId}`);
    }
  } catch (error) {
    console.error('Failed to log reminder sent:', error);
  }
}

export async function logReminderPending(
  leadId: number,
  productId: number,
  reminderId: number,
  scheduledAt: number,
  message: string
): Promise<void> {
  try {
    const existingPending = await getOne<{ id: number }>(
      `SELECT id FROM reminder_logs 
       WHERE lead_id = ? AND product_id = ? AND reminder_id = ? AND status = 'pending'
       ORDER BY id DESC LIMIT 1`,
      [leadId, productId, reminderId]
    );

    if (existingPending) {
      await run(
        `UPDATE reminder_logs SET 
          scheduled_at = ?, 
          message_preview = ?,
          status = 'pending',
          sent_at = NULL,
          error = NULL
        WHERE id = ?`,
        [scheduledAt, message.substring(0, 100), existingPending.id]
      );
    } else {
      await run(
        `INSERT INTO reminder_logs (lead_id, product_id, reminder_id, scheduled_at, status, message_preview) 
         VALUES (?, ?, ?, ?, 'pending', ?)`,
        [leadId, productId, reminderId, scheduledAt, message.substring(0, 100)]
      );
    }
  } catch (error) {
    console.error('Failed to log reminder pending:', error);
  }
}

export async function logReminderFailed(
  leadId: number,
  productId: number,
  reminderId: number,
  error: string
): Promise<void> {
  try {
    await run(
      `UPDATE reminder_logs SET status = 'failed', error = ? WHERE lead_id = ? AND product_id = ? AND reminder_id = ? AND status = 'pending'`,
      [error, leadId, productId, reminderId]
    );
  } catch (err) {
    console.error('Failed to log reminder failed:', err);
  }
}

export async function checkTimeouts(): Promise<void> {
  const timeoutEvents = await query<WhatsAppEvent>(`
    SELECT * FROM whatsapp_events
    WHERE trigger_type = 'stage_timeout'
    AND is_active = 1
    AND timeout_minutes IS NOT NULL
  `);

  for (const event of timeoutEvents) {
    const timeoutMs = (event.timeout_minutes || 60) * 60 * 1000;
    const cutoffTime = Date.now() - timeoutMs;

    const stagnantLeads = await query<LeadInfo>(`
      SELECT DISTINCT l.*, p.name as product_name, s.name as stage_name
      FROM leads l
      JOIN lead_stage_history h ON l.id = h.lead_id
      LEFT JOIN products p ON l.product_id = p.id
      LEFT JOIN stages s ON l.stage_id = s.id
      WHERE h.stage_id = ?
      AND h.exited_at IS NULL
      AND h.entered_at <= ?
    `, [event.stage_id, cutoffTime]);

    for (const lead of stagnantLeads) {
      await processEvent(event, lead.id);
    }
  }
}
