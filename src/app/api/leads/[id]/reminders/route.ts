import { NextRequest, NextResponse } from 'next/server';
import { getOne, run, query } from '@/lib/db';
import { ReminderService } from '@/lib/services/reminder.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leadId = parseInt(id);

    if (isNaN(leadId)) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    }

    const lead = getOne<{ id: number }>('SELECT id FROM leads WHERE id = ?', [leadId]);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const scheduledReminders = query<{
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
      lead_name: string | null;
      product_name: string | null;
    }>(`
      SELECT 
        sr.*,
        l.name as lead_name,
        p.name as product_name
      FROM scheduled_reminders sr
      LEFT JOIN leads l ON sr.lead_id = l.id
      LEFT JOIN products p ON sr.product_id = p.id
      WHERE sr.lead_id = ?
      ORDER BY sr.scheduled_at DESC
    `, [leadId]);

    const logs = query<{
      id: number;
      lead_id: number;
      product_id: number;
      reminder_id: number;
      scheduled_at: string;
      sent_at: string | null;
      status: string;
      message_preview: string | null;
      next_scheduled_at: string | null;
      error: string | null;
      is_manual: number;
      parent_log_id: number | null;
      created_at: string;
      lead_name: string | null;
      product_name: string | null;
    }>(`
      SELECT 
        rl.*,
        l.name as lead_name,
        p.name as product_name
      FROM reminder_logs rl
      LEFT JOIN leads l ON rl.lead_id = l.id
      LEFT JOIN products p ON rl.product_id = p.id
      WHERE rl.lead_id = ?
      ORDER BY rl.scheduled_at DESC
      LIMIT 50
    `, [leadId]);

    return NextResponse.json({
      scheduled: scheduledReminders,
      logs: logs,
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leadId = parseInt(id);

    if (isNaN(leadId)) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    }

    const body = await request.json();
    const { product_id, message, instance_name, scheduled_at } = body;

    const validation = ReminderService.validateReminderData({
      message,
      instance_name,
      scheduled_at
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // For manual reminders, product_id is optional (can be null)
    const finalProductId = product_id || null;

    const lead = getOne<{ id: number; name: string; phone: string }>(
      'SELECT id, name, phone FROM leads WHERE id = ?',
      [leadId]
    );
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const pendingCount = getOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM scheduled_reminders WHERE lead_id = ? AND status = 'pending'`,
      [leadId]
    );

    if (pendingCount && pendingCount.count >= 5) {
      return NextResponse.json(
        { error: 'Maximum of 5 pending reminders per lead' },
        { status: 400 }
      );
    }

    const scheduledAtUnix = Math.floor(new Date(scheduled_at).getTime() / 1000);

    const result = run(
      `INSERT INTO scheduled_reminders (
        lead_id, product_id, message, instance_name, scheduled_at, status, is_manual
      ) VALUES (?, ?, ?, ?, ?, 'pending', 1)`,
      [leadId, finalProductId, message, instance_name, scheduledAtUnix]
    );

    const newReminder = getOne<{
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
      lead_name: string | null;
      product_name: string | null;
    }>(
      `SELECT sr.*, l.name as lead_name, p.name as product_name
       FROM scheduled_reminders sr
       LEFT JOIN leads l ON sr.lead_id = l.id
       LEFT JOIN products p ON sr.product_id = p.id
       WHERE sr.id = ?`,
      [result.id]
    );

    return NextResponse.json(newReminder, { status: 201 });
  } catch (error) {
    console.error('Error creating scheduled reminder:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduled reminder' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { id, scheduled_at, message, instance_name, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Reminder ID is required' }, { status: 400 });
    }

    const existingReminder = getOne<{ id: number; lead_id: number; status: string }>(
      'SELECT id, lead_id, status FROM scheduled_reminders WHERE id = ?',
      [id]
    );

    if (!existingReminder) {
      return NextResponse.json({ error: 'Scheduled reminder not found' }, { status: 404 });
    }

    if (existingReminder.lead_id !== leadId) {
      return NextResponse.json({ error: 'Reminder does not belong to this lead' }, { status: 403 });
    }

    if (existingReminder.status === 'sent') {
      return NextResponse.json({ error: 'Cannot update a sent reminder' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (scheduled_at) {
      updates.push('scheduled_at = ?');
      values.push(Math.floor(new Date(scheduled_at).getTime() / 1000));
    }

    if (message) {
      updates.push('message = ?');
      values.push(message);
    }

    if (instance_name) {
      updates.push('instance_name = ?');
      values.push(instance_name);
    }

    if (status && ReminderService.isValidStatus(status) && ['pending', 'cancelled', 'paused'].includes(status)) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);

    run(
      `UPDATE scheduled_reminders SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedReminder = getOne<{
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
      lead_name: string | null;
      product_name: string | null;
    }>(
      `SELECT sr.*, l.name as lead_name, p.name as product_name
       FROM scheduled_reminders sr
       LEFT JOIN leads l ON sr.lead_id = l.id
       LEFT JOIN products p ON sr.product_id = p.id
       WHERE sr.id = ?`,
      [id]
    );

    return NextResponse.json(updatedReminder);
  } catch (error) {
    console.error('Error updating scheduled reminder:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled reminder' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadIdStr } = await params;
    const leadId = parseInt(leadIdStr);

    if (isNaN(leadId)) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    }

    const url = new URL(request.url);
    const reminderId = parseInt(url.searchParams.get('id') || '');

    if (isNaN(reminderId)) {
      return NextResponse.json({ error: 'Reminder ID is required' }, { status: 400 });
    }

    const existingReminder = getOne<{ id: number; lead_id: number; status: string }>(
      'SELECT id, lead_id, status FROM scheduled_reminders WHERE id = ?',
      [reminderId]
    );

    if (!existingReminder) {
      return NextResponse.json({ error: 'Scheduled reminder not found' }, { status: 404 });
    }

    if (existingReminder.lead_id !== leadId) {
      return NextResponse.json({ error: 'Reminder does not belong to this lead' }, { status: 403 });
    }

    run('DELETE FROM scheduled_reminders WHERE id = ?', [reminderId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled reminder:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled reminder' },
      { status: 500 }
    );
  }
}
