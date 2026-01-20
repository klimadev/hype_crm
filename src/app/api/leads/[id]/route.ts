import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { run, getOne, query } from '@/lib/db';

async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  await run('BEGIN TRANSACTION');
  try {
    const result = await fn();
    await run('COMMIT');
    return result;
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const lead = await getOne(`
      SELECT l.*, s.name as stage_name, p.name as product_name
      FROM leads l
      LEFT JOIN stages s ON l.stage_id = s.id
      LEFT JOIN products p ON l.product_id = p.id
      WHERE l.id = ?
    `, [parseInt(id)]);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, product_id, stage_id } = body;

    const currentLead = await getOne<{ name: string; phone: string; email: string | null; product_id: number | null; stage_id: number | null }>(
      'SELECT name, phone, email, product_id, stage_id FROM leads WHERE id = ?',
      [parseInt(id)]
    );

    if (!currentLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updatedName = name !== undefined ? name : currentLead.name;
    const updatedPhone = phone !== undefined ? phone : currentLead.phone;
    const updatedEmail = email !== undefined ? email : currentLead.email;
    const updatedProductId = product_id !== undefined ? product_id : currentLead.product_id;
    const updatedStageId = stage_id !== undefined ? stage_id : currentLead.stage_id;

    if (updatedName === undefined || updatedName === null || updatedName.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (updatedPhone === undefined || updatedPhone === null || updatedPhone.trim() === '') {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    const needsHistoryUpdate = stage_id !== undefined && stage_id !== null && stage_id !== currentLead.stage_id;

    if (needsHistoryUpdate) {
      await withTransaction(async () => {
        await run(
          `UPDATE leads SET name = ?, phone = ?, email = ?, product_id = ?, stage_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [updatedName, updatedPhone, updatedEmail, updatedProductId, updatedStageId, parseInt(id)]
        );

        await run(
          `UPDATE lead_stage_history SET exited_at = CURRENT_TIMESTAMP WHERE lead_id = ? AND exited_at IS NULL`,
          [parseInt(id)]
        );
        await run(
          `INSERT INTO lead_stage_history (lead_id, stage_id) VALUES (?, ?)`,
          [parseInt(id), stage_id]
        );
      });
    } else {
      await run(
        `UPDATE leads SET name = ?, phone = ?, email = ?, product_id = ?, stage_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [updatedName, updatedPhone, updatedEmail, updatedProductId, updatedStageId, parseInt(id)]
      );
    }

    if (needsHistoryUpdate) {
      const whatsappTriggerRes = await fetch(`${request.nextUrl.origin}/api/whatsapp-events/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: parseInt(id), stageId: stage_id }),
      });

      if (!whatsappTriggerRes.ok) {
        console.error('WhatsApp trigger failed:', await whatsappTriggerRes.text());
      }
    }

    const lead = await getOne(`
      SELECT l.*, s.name as stage_name, p.name as product_name
      FROM leads l
      LEFT JOIN stages s ON l.stage_id = s.id
      LEFT JOIN products p ON l.product_id = p.id
      WHERE l.id = ?
    `, [parseInt(id)]);

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingLead = await getOne('SELECT id FROM leads WHERE id = ?', [parseInt(id)]);
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await run('DELETE FROM leads WHERE id = ?', [parseInt(id)]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
