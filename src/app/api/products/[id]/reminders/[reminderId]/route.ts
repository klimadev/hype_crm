import { NextRequest, NextResponse } from 'next/server';
import { run, getOne } from '@/lib/db';
import { ProductReminder, UpdateReminderData } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { id, reminderId } = await params;
    const body: UpdateReminderData = await request.json();
    const { stage_id, delay_value, delay_unit, reminder_mode, message, is_active } = body;

    const existingReminder = await getOne<ProductReminder>(
      `SELECT pr.*, s.name as stage_name
       FROM product_reminders pr
       LEFT JOIN stages s ON pr.stage_id = s.id
       WHERE pr.id = ? AND pr.product_id = ?`,
      [parseInt(reminderId), parseInt(id)]
    );

    if (!existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    if (stage_id) {
      const stage = await getOne('SELECT id FROM stages WHERE id = ?', [stage_id]);
      if (!stage) {
        return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
      }
    }

    await run(
      `UPDATE product_reminders SET stage_id = ?, delay_value = ?, delay_unit = ?, reminder_mode = ?, message = ?, is_active = ? WHERE id = ?`,
      [
        stage_id ?? existingReminder.stage_id,
        delay_value ?? existingReminder.delay_value,
        delay_unit ?? existingReminder.delay_unit,
        reminder_mode ?? existingReminder.reminder_mode,
        message ?? existingReminder.message,
        is_active !== undefined ? (is_active ? 1 : 0) : existingReminder.is_active,
        parseInt(reminderId)
      ]
    );

    const reminder = await getOne<ProductReminder>(`
      SELECT pr.*, s.name as stage_name
      FROM product_reminders pr
      LEFT JOIN stages s ON pr.stage_id = s.id
      WHERE pr.id = ?
    `, [parseInt(reminderId)]);

    return NextResponse.json(reminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { id, reminderId } = await params;

    const existingReminder = await getOne(
      'SELECT id FROM product_reminders WHERE id = ? AND product_id = ?',
      [parseInt(reminderId), parseInt(id)]
    );

    if (!existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    await run('DELETE FROM product_reminders WHERE id = ?', [parseInt(reminderId)]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}
