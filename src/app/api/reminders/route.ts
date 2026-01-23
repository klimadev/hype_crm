import { NextRequest, NextResponse } from 'next/server';
import { ReminderManager } from '@/lib/reminders';
import { ReminderService } from '@/lib/services/reminder.service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId');
  const productId = searchParams.get('productId');

  try {
    let query = 'SELECT * FROM reminders WHERE 1=1';
    const params: any[] = [];

    if (leadId) {
      query += ' AND lead_id = ?';
      params.push(leadId);
    }
    if (productId) {
      query += ' AND product_id = ?';
      params.push(productId);
    }

    // For simplicity, return all, but in real, paginate
    const reminders = await import('@/lib/db').then(m => m.query(query, params));

    return NextResponse.json(reminders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, leadId, productId, message, instanceName, scheduledAt, reminderId } = body;

  try {
    if (action === 'create') {
      const validation = ReminderService.validateReminderData({ lead_id: leadId, product_id: productId, message, instance_name: instanceName, scheduled_at: scheduledAt });
      if (!validation.valid) {
        return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
      }
      const id = await ReminderManager.createManualReminder(leadId, productId || null, message, instanceName, scheduledAt);
      return NextResponse.json({ id }, { status: 201 });
    } else if (action === 'send-now') {
      // Send immediate
      const reminder = await import('@/lib/db').then(m => m.getOne<{
        lead_name: string;
        lead_phone: string;
        product_name: string | null;
        message: string;
        instance_name: string | null;
      }>(`
        SELECT l.name as lead_name, l.phone as lead_phone, p.name as product_name, r.message, r.instance_name
        FROM reminders r
        JOIN leads l ON r.lead_id = l.id
        LEFT JOIN products p ON r.product_id = p.id
        WHERE r.id = ?
      `, [reminderId]));
      if (!reminder) return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
      const sent = await ReminderManager.sendReminder(reminder);
      if (sent) {
        await ReminderManager.updateStatus(reminderId, 'sent');
        return NextResponse.json({ success: true });
      } else {
        await ReminderManager.updateStatus(reminderId, 'failed');
        return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
      }
    } else if (action === 'process') {
      const result = await ReminderManager.processDueReminders();
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, status } = body;

  try {
    await ReminderManager.updateStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    await import('@/lib/db').then(m => m.run('DELETE FROM reminders WHERE id = ?', [id]));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}