import { NextRequest, NextResponse } from 'next/server';
import { query, run, getOne } from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';
import { resolveTemplate } from '@/lib/whatsapp/templates';
import { logReminderSent, logReminderPending, logReminderFailed } from '@/lib/services/whatsapp-events';

const MOCK_MODE = process.env.WHATSAPP_MOCK === 'true';

const RECURRENCE_MS: Record<string, number> = {
  minute_30: 30 * 60 * 1000,
  hour_1: 1 * 60 * 60 * 1000,
  hour_2: 2 * 60 * 60 * 1000,
  hour_4: 4 * 60 * 60 * 1000,
  hour_8: 8 * 60 * 60 * 1000,
  day_1: 1 * 24 * 60 * 60 * 1000,
  day_3: 3 * 24 * 60 * 60 * 1000,
  day_7: 7 * 24 * 60 * 60 * 1000,
  day_15: 15 * 24 * 60 * 60 * 1000,
  day_30: 30 * 24 * 60 * 60 * 1000,
  day_60: 60 * 24 * 60 * 60 * 1000,
  day_90: 90 * 24 * 60 * 60 * 1000,
  month_1: 30 * 24 * 60 * 60 * 1000,
  month_2: 60 * 24 * 60 * 60 * 1000,
  month_3: 90 * 24 * 60 * 60 * 1000,
  month_6: 180 * 24 * 60 * 60 * 1000,
};

interface ReminderCheck {
  lead_id: number;
  lead_name: string;
  lead_phone: string;
  product_id: number;
  product_name: string;
  instance_name: string;
  reminder_id: number;
  delay_value: number;
  delay_unit: string;
  reminder_mode: string;
  message_template: string;
  cycle_count: number;
  last_service_date: string | null;
  recurrence_type: string;
}

function calculateNextReminderDate(delayValue: number, delayUnit: string): Date {
  const now = new Date();
  switch (delayUnit) {
    case 'minute':
      return new Date(now.getTime() + delayValue * 60 * 1000);
    case 'hour':
      return new Date(now.getTime() + delayValue * 60 * 60 * 1000);
    case 'day':
      return new Date(now.getTime() + delayValue * 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() + delayValue * 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() + delayValue * 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log(`[Recurrence Check] 🔄 Verificando lembretes pendentes...`);

    const remindersToSend = await query<ReminderCheck>(`
      SELECT
        l.id as lead_id,
        l.name as lead_name,
        l.phone as lead_phone,
        p.id as product_id,
        p.name as product_name,
        p.instance_name,
        pr.id as reminder_id,
        pr.delay_value,
        pr.delay_unit,
        pr.reminder_mode,
        pr.message as message_template,
        lrt.cycle_count,
        lrt.last_service_date,
        p.recurrence_type
      FROM lead_recurrence_tracker lrt
      INNER JOIN leads l ON lrt.lead_id = l.id
      INNER JOIN products p ON lrt.product_id = p.id
      INNER JOIN product_reminders pr ON pr.product_id = p.id
      WHERE lrt.next_reminder_date <= unixepoch()
        AND pr.is_active = 1
      ORDER BY lrt.next_reminder_date ASC
    `);

    console.log(`[Recurrence Check] 📊 Encontrados ${remindersToSend.length} lembretes para processar`);

    const results: { success: number; failed: number; pending: number; errors: string[] } = {
      success: 0,
      failed: 0,
      pending: remindersToSend.length,
      errors: [],
    };

    for (const reminder of remindersToSend) {
      try {
        const message = resolveTemplate(reminder.message_template, {
          leadName: reminder.lead_name,
          leadPhone: reminder.lead_phone,
          productName: reminder.product_name,
          stageName: '',
        });

        console.log(`[Recurrence Check] 📱 Processando lembrete para lead ${reminder.lead_name} (${reminder.lead_phone})`);

        let sent = false;

        if (MOCK_MODE) {
          console.log(`[MOCK] 📱 WhatsApp enviado para ${reminder.lead_phone}: "${message.substring(0, 50)}..."`);
          sent = true;
        } else {
          const result = await sendWhatsAppMessage({
            instanceName: reminder.instance_name || process.env.EVOLUTION_INSTANCE_NAME || 'teste2',
            phone: reminder.lead_phone,
            message,
          });
          sent = result.success;
        }

        if (sent) {
          let nextReminderDate: number | null = null;
          let nextScheduledAt: number | null = null;

          if (reminder.reminder_mode === 'recurring') {
            const nextDate = calculateNextReminderDate(reminder.delay_value, reminder.delay_unit);
            nextScheduledAt = Math.floor(nextDate.getTime() / 1000);
            nextReminderDate = nextScheduledAt;
          }

          await run(
            `UPDATE lead_recurrence_tracker SET
              cycle_count = ?,
              last_service_date = COALESCE(last_service_date, unixepoch()),
              next_reminder_date = ?
            WHERE lead_id = ? AND product_id = ?`,
            [reminder.cycle_count + 1, nextReminderDate || null, reminder.lead_id, reminder.product_id]
          );

          await logReminderSent(
            reminder.lead_id,
            reminder.product_id,
            reminder.reminder_id,
            message,
            nextScheduledAt
          );

          results.success++;
          console.log(`[Recurrence Check] ✅ Lembrete enviado com sucesso para ${reminder.lead_name}`);
        } else {
          await logReminderFailed(
            reminder.lead_id,
            reminder.product_id,
            reminder.reminder_id,
            'API returned false'
          );
          results.failed++;
          results.errors.push(`Failed to send to lead ${reminder.lead_id}: API returned false`);
        }
      } catch (error) {
        await logReminderFailed(
          reminder.lead_id,
          reminder.product_id,
          reminder.reminder_id,
          String(error)
        );
        results.failed++;
        results.errors.push(`Error sending to lead ${reminder.lead_id}: ${error}`);
      }
    }

    return NextResponse.json({
      processed: remindersToSend.length,
      ...results,
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500 });
  }
}
