import { NextRequest, NextResponse } from 'next/server';
import { run, getOne, query } from '@/lib/db';
import { ProductReminder, CreateReminderData, UpdateReminderData } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reminders = await query<ProductReminder>(`
      SELECT pr.*, s.name as stage_name
      FROM product_reminders pr
      LEFT JOIN stages s ON pr.stage_id = s.id
      WHERE pr.product_id = ?
      ORDER BY pr.created_at DESC
    `, [parseInt(id)]);

    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { stage_id, delay_value, delay_unit, reminder_mode, message, is_active, instance_name } = body;

    if (!stage_id || !delay_value || !delay_unit || !message) {
      return NextResponse.json({ error: 'stage_id, delay_value, delay_unit, and message are required' }, { status: 400 });
    }

    const product = await getOne('SELECT id FROM products WHERE id = ?', [parseInt(id)]);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const stage = await getOne('SELECT id FROM stages WHERE id = ?', [stage_id]);
    if (!stage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    const result = await run(
      `INSERT INTO product_reminders (product_id, stage_id, delay_value, delay_unit, reminder_mode, instance_name, message, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [parseInt(id), stage_id, delay_value, delay_unit, reminder_mode || 'once', instance_name, message, is_active !== false ? 1 : 0]
    );

    const reminder = await getOne<ProductReminder>(`
      SELECT pr.*, s.name as stage_name
      FROM product_reminders pr
      LEFT JOIN stages s ON pr.stage_id = s.id
      WHERE pr.id = ?
    `, [result.id]);

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
}
