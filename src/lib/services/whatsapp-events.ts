import { query, getOne } from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';
import { resolveTemplate } from '@/lib/whatsapp/templates';

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
  stage_name?: string;
}

export async function handleStageEntry(leadId: number, stageId: number): Promise<void> {
  const events = await query<WhatsAppEvent>(`
    SELECT * FROM whatsapp_events
    WHERE trigger_type = 'stage_entry'
    AND stage_id = ?
    AND is_active = 1
  `, [stageId]);

  for (const event of events) {
    await processEvent(event, leadId);
  }
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
  const lead = await getOne<LeadInfo>(`
    SELECT l.*, p.name as product_name, s.name as stage_name
    FROM leads l
    LEFT JOIN products p ON l.product_id = p.id
    LEFT JOIN stages s ON l.stage_id = s.id
    WHERE l.id = ?
  `, [leadId]);

  if (!lead) {
    console.error(`Lead ${leadId} not found`);
    return;
  }

  const message = resolveTemplate(event.message_template, {
    leadName: lead.name,
    leadPhone: lead.phone,
    productName: lead.product_name || '',
    stageName: lead.stage_name || '',
  });

  const success = await sendWhatsAppMessage({
    phone: lead.phone,
    message,
  });

  if (success) {
    console.log(`WhatsApp message sent to ${lead.phone} for event "${event.name}"`);
  } else {
    console.error(`Failed to send WhatsApp message for event "${event.name}" to ${lead.phone}`);
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
