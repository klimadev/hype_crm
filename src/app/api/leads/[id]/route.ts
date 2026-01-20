import { NextRequest, NextResponse } from 'next/server';
import { run, getOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { id } = await params;
    const { name, phone, email, product_id, stage_id } = await request.json();

    const currentLead = await getOne<{ stage_id: number | null }>('SELECT stage_id FROM leads WHERE id = ?', [parseInt(id)]);
    
    await run(
      `UPDATE leads SET name = ?, phone = ?, email = ?, product_id = ?, stage_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, phone, email || null, product_id || null, stage_id || null, parseInt(id)]
    );

    if (stage_id && stage_id !== currentLead?.stage_id) {
      await run(
        `UPDATE lead_stage_history SET exited_at = CURRENT_TIMESTAMP WHERE lead_id = ? AND exited_at IS NULL`,
        [parseInt(id)]
      );
      await run(
        `INSERT INTO lead_stage_history (lead_id, stage_id) VALUES (?, ?)`,
        [parseInt(id), stage_id]
      );

      await fetch(`${request.nextUrl.origin}/api/whatsapp-events/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: parseInt(id), stageId: stage_id }),
      }).catch(() => {});
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
    const { id } = await params;
    await run('DELETE FROM leads WHERE id = ?', [parseInt(id)]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
