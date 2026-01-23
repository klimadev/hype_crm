import { NextRequest, NextResponse } from 'next/server';
import { getOne, run } from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';
import { ReminderService } from '@/lib/services/reminder.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadIdStr } = await params;
    const leadId = parseInt(leadIdStr);

    if (isNaN(leadId)) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    }

    const body = await request.json();
    const { reminder_id, message, instance_name } = body;

    const lead = getOne<{ id: number; name: string; phone: string }>(
      'SELECT id, name, phone FROM leads WHERE id = ?',
      [leadId]
    );

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    let reminderMessage = message;
    let reminderInstance = instance_name;
    let productId: number | null = null;
    let productName: string | null = null;

    if (reminder_id) {
      const scheduledReminder = getOne<{
        id: number;
        message: string;
        instance_name: string;
        product_id: number | null;
        lead_id: number;
        status: string;
      }>(
        'SELECT * FROM scheduled_reminders WHERE id = ? AND lead_id = ?',
        [reminder_id, leadId]
      );

      if (!scheduledReminder) {
        return NextResponse.json({ error: 'Scheduled reminder not found' }, { status: 404 });
      }

      if (scheduledReminder.status === 'sent') {
        return NextResponse.json({ error: 'Reminder already sent' }, { status: 400 });
      }

      reminderMessage = scheduledReminder.message;
      reminderInstance = scheduledReminder.instance_name;
      productId = scheduledReminder.product_id;
    }

    if (productId) {
      const product = getOne<{ name: string }>(
        'SELECT name FROM products WHERE id = ?',
        [productId]
      );
      productName = product?.name || null;
    }

    const phone = lead.phone.replace(/\D/g, '');
    const messageWithVariables = ReminderService.resolveMessageTemplate(reminderMessage, {
      leadName: lead.name,
      leadPhone: lead.phone,
      productName: productName || undefined,
      stageName: undefined
    });

    const result = await sendWhatsAppMessage({
      instanceName: reminderInstance,
      phone: `55${phone}`,
      message: messageWithVariables,
    });

    const now = Math.floor(Date.now() / 1000);

    if (result.success) {
      if (reminder_id) {
        run(
          `UPDATE scheduled_reminders SET status = 'sent', sent_at = ?, error = NULL WHERE id = ?`,
          [now, reminder_id]
        );
      }

      const logId = run(
        `INSERT INTO reminder_logs (
          lead_id, product_id, reminder_id, scheduled_at, sent_at, status, message_preview, is_manual
        ) VALUES (?, ?, ?, ?, ?, 'sent', ?, 1)`,
        [
          leadId,
          productId || 0,
          reminder_id || 0,
          now,
          now,
          messageWithVariables.substring(0, 100),
        ]
      );

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        logId: logId.id,
      });
    } else {
      if (reminder_id) {
        run(
          `UPDATE scheduled_reminders SET status = 'failed', error = ? WHERE id = ?`,
          [result.error, reminder_id]
        );
      }

      const logId = run(
        `INSERT INTO reminder_logs (
          lead_id, product_id, reminder_id, scheduled_at, status, message_preview, error, is_manual
        ) VALUES (?, ?, ?, ?, 'failed', ?, ?, 1)`,
        [
          leadId,
          productId || 0,
          reminder_id || 0,
          now,
          reminderMessage.substring(0, 100),
          result.error,
        ]
      );

      return NextResponse.json(
        { error: result.error, logId: logId.id },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    );
  }
}


