import { NextRequest, NextResponse } from 'next/server';
import { query, run, getOne } from '@/lib/db';

export async function GET() {
  try {
    const stages = await query(`
      SELECT * FROM stages ORDER BY position ASC
    `);
    return NextResponse.json(stages);
  } catch (error) {
    console.error('Error fetching stages:', error);
    return NextResponse.json({ error: 'Failed to fetch stages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, position } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const maxPosition = await getOne<{ max: number | null }>('SELECT MAX(position) as max FROM stages');
    const newPosition = position ?? ((maxPosition?.max ?? 0) + 1);

    const result = await run(
      `INSERT INTO stages (name, position) VALUES (?, ?)`,
      [name, newPosition]
    );

    const stage = await getOne('SELECT * FROM stages WHERE id = ?', [result.id]);
    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error('Error creating stage:', error);
    return NextResponse.json({ error: 'Failed to create stage' }, { status: 500 });
  }
}
