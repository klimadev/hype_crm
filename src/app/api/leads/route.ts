import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query, run, getOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    const search = searchParams.get('search') || '';
    const stageIds = searchParams.get('stage_id');
    const productIds = searchParams.get('product_id');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const whereConditions: string[] = [];
    const params: (string | number | null)[] = [];

    if (search) {
      whereConditions.push('(l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (stageIds) {
      const ids = stageIds.split(',').map(Number).filter(id => !isNaN(id));
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(', ');
        whereConditions.push(`l.stage_id IN (${placeholders})`);
        params.push(...ids);
      }
    }

    if (productIds) {
      const ids = productIds.split(',').map(Number).filter(id => !isNaN(id));
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(', ');
        whereConditions.push(`l.product_id IN (${placeholders})`);
        params.push(...ids);
      }
    }

    if (status) {
      const statuses = status.split(',').filter(s => s);
      if (statuses.length > 0) {
        const placeholders = statuses.map(() => '?').join(', ');
        whereConditions.push(`l.status IN (${placeholders})`);
        params.push(...statuses);
      }
    }

    if (dateFrom) {
      whereConditions.push('l.created_at >= ?');
      params.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('l.created_at <= ?');
      params.push(dateTo);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const [leads, total] = await Promise.all([
      query(`
        SELECT l.*, s.name as stage_name, p.name as product_name
        FROM leads l
        LEFT JOIN stages s ON l.stage_id = s.id
        LEFT JOIN products p ON l.product_id = p.id
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]),
      getOne<{ count: number }>(`
        SELECT COUNT(*) as count FROM leads l ${whereClause}
      `, params),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total: total?.count || 0,
        totalPages: Math.ceil((total?.count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone, email, product_id, stage_id } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const phoneRegex = /^\(?([0-9]{2})\)?[-. ]?([0-9]{5})[-. ]?([0-9]{4})$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone format. Use format: (11) 99999-9999' }, { status: 400 });
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
