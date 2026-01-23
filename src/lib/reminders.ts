import { query, getOne, run } from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';
import { ReminderService } from '@/lib/services/reminder.service';

const MOCK_MODE = process.env.WHATSAPP_MOCK === 'true';

interface ReminderTemplate {
  trigger_type: string;
  trigger_value: string;
  reminder_type: string;
  recurrence?: { delay_value: number; delay_unit: string };
  message: string;
  instance: string;
}

export class ReminderManager {
  /**
   * Get templates for a product
   */
  static getTemplatesForProduct(productId: number): ReminderTemplate[] {
    const product = getOne<{ reminder_templates: string }>('SELECT reminder_templates FROM products WHERE id = ?', [productId]);
    if (!product?.reminder_templates) return [];
    try {
      return JSON.parse(product.reminder_templates);
    } catch {
      return [];
    }
  }

  /**
   * Create reminder instance when triggered
   */
  static async createReminder(leadId: number, productId: number, triggerType: string, triggerValue: string): Promise<void> {
    const templates = this.getTemplatesForProduct(productId);
    const matching = templates.find(t => t.trigger_type === triggerType && t.trigger_value === triggerValue);
    if (!matching) return;

    const scheduledAt = this.calculateScheduledAt(matching.recurrence);

    await run(
      'INSERT INTO reminders (lead_id, product_id, type, trigger_type, trigger_value, message, instance_name, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [leadId, productId, matching.reminder_type === 'automated_recurring' ? 'automated' : 'automated', triggerType, triggerValue, matching.message, matching.instance, scheduledAt]
    );
  }

  /**
   * Calculate scheduled timestamp from recurrence
   */
  static calculateScheduledAt(recurrence?: { delay_value: number; delay_unit: string }): number {
    if (!recurrence) return Math.floor(Date.now() / 1000);
    const now = new Date();
    switch (recurrence.delay_unit) {
      case 'minute': now.setMinutes(now.getMinutes() + recurrence.delay_value); break;
      case 'hour': now.setHours(now.getHours() + recurrence.delay_value); break;
      case 'day': now.setDate(now.getDate() + recurrence.delay_value); break;
      case 'week': now.setDate(now.getDate() + recurrence.delay_value * 7); break;
      case 'month': now.setMonth(now.getMonth() + recurrence.delay_value); break;
    }
    return Math.floor(now.getTime() / 1000);
  }

  /**
   * Process due reminders
   */
  static async processDueReminders(): Promise<{ success: number; failed: number }> {
    const dueReminders = await query<{
      id: number;
      lead_id: number;
      lead_name: string;
      lead_phone: string;
      product_id: number;
      product_name: string | null;
      type: string;
      trigger_type: string;
      message: string;
      instance_name: string | null;
      scheduled_at: number;
    }>(`
      SELECT r.*, l.name as lead_name, l.phone as lead_phone, p.name as product_name
      FROM reminders r
      JOIN leads l ON r.lead_id = l.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.status = 'pending' AND r.scheduled_at <= unixepoch()
    `);

    let success = 0, failed = 0;

    for (const reminder of dueReminders) {
      try {
        const result = await this.sendReminder(reminder);
        if (result) {
          success++;
          await this.updateStatus(reminder.id, 'sent');
          // For recurring, create next
          if (reminder.type === 'automated' && reminder.trigger_type === 'recurrence') {
            const templates = this.getTemplatesForProduct(reminder.product_id);
            const matching = templates.find(t => t.trigger_type === 'stage_entry' && t.reminder_type === 'automated_recurring');
            if (matching?.recurrence) {
              const nextScheduledAt = this.calculateScheduledAt(matching.recurrence);
              await run(
                'INSERT INTO reminders (lead_id, product_id, type, trigger_type, trigger_value, message, instance_name, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [reminder.lead_id, reminder.product_id, 'automated', 'recurrence', nextScheduledAt.toString(), reminder.message, reminder.instance_name, nextScheduledAt]
              );
            }
          }
        } else {
          failed++;
          await this.updateStatus(reminder.id, 'failed', 'Send failed');
        }
      } catch (error) {
        failed++;
        await this.updateStatus(reminder.id, 'failed', String(error));
      }
    }

    return { success, failed };
  }

  /**
   * Send reminder via WhatsApp
   */
  static async sendReminder(reminder: {
    lead_name: string;
    lead_phone: string;
    product_name: string | null;
    message: string;
    instance_name: string | null;
  }): Promise<boolean> {
    const context = {
      leadName: reminder.lead_name,
      leadPhone: reminder.lead_phone,
      productName: reminder.product_name || undefined,
      stageName: ''
    };
    const resolvedMessage = ReminderService.resolveMessageTemplate(reminder.message, context);

    if (MOCK_MODE) {
      console.log(`[MOCK] 📱 WhatsApp sent to ${reminder.lead_phone}: "${resolvedMessage.substring(0, 50)}..."`);
      return true;
    }

    const result = await sendWhatsAppMessage({
      instanceName: reminder.instance_name || process.env.EVOLUTION_INSTANCE_NAME || 'default',
      phone: reminder.lead_phone,
      message: resolvedMessage,
    });

    return result.success;
  }

  /**
   * Update reminder status
   */
  static async updateStatus(reminderId: number, status: string, error?: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const sentAt = status === 'sent' ? now : null;
    await run(
      'UPDATE reminders SET status = ?, sent_at = ?, error = ? WHERE id = ?',
      [status, sentAt, error || null, reminderId]
    );
  }

  /**
   * Create manual reminder
   */
  static async createManualReminder(leadId: number, productId: number, message: string, instanceName: string, scheduledAt: number): Promise<number> {
    await run(
      'INSERT INTO reminders (lead_id, product_id, type, trigger_type, message, instance_name, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [leadId, productId, 'manual', 'scheduled', message, instanceName, scheduledAt]
    );
    const inserted = await getOne<{ id: number }>('SELECT last_insert_rowid() as id');
    return inserted?.id || 0;
  }
}