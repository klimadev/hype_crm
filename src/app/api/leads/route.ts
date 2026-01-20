import { NextRequest, NextResponse } from 'next/server';
import { query, run, getOne } from '@/lib/db';

export async function GET() {
  try {
    const leads = await query(`
      SELECT l.*, s.name as stage_name, p.name as product_name
      FROM leads l
      LEFT JOIN stages s ON l.stage_id = s.id
      LEFT JOIN products p ON l.product_id = p.id
      ORDER BY l.created_at DESC
    `);
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, product_id, stage_id } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const result = await run(
      `INSERT INTO leads (name, phone, email, product_id, stage_id) VALUES (?, ?, ?, ?, ?)`,
      [name, phone, email || null, product_id || null, stage_id || null]
    );

    if (stage_id) {
      await run(
        `INSERT INTO lead_stage_history (lead_id, stage_id) VALUES (?, ?)`,
        [result.id, stage_id]
      );
    }

    const lead = await getOne(`
      SELECT l.*, s.name as stage_name, p.name as product_name
      FROM leads l
      LEFT JOIN stages s ON l.stage_id = s.id
      LEFT JOIN products p ON l.product_id = p.id
      WHERE l.id = ?
    `, [result.id]);

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
