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
    const { name, color, position } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const maxPosition = await getOne<{ max: number | null }>('SELECT MAX(position) as max FROM stages');
    const newPosition = position ?? ((maxPosition?.max ?? 0) + 1);

    const result = await run(
      `INSERT INTO stages (name, color, position) VALUES (?, ?, ?)`,
      [name, color || '#6366f1', newPosition]
    );

    const stage = await getOne('SELECT * FROM stages WHERE id = ?', [result.id]);
    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error('Error creating stage:', error);
    return NextResponse.json({ error: 'Failed to create stage' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, color, position } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const existing = await getOne<{ name: string; color: string; position: number }>('SELECT * FROM stages WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    await run(
      `UPDATE stages SET name = ?, color = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name ?? existing.name, color ?? existing.color, position ?? existing.position, id]
    );

    const stage = await getOne('SELECT * FROM stages WHERE id = ?', [id]);
    return NextResponse.json(stage);
  } catch (error) {
    console.error('Error updating stage:', error);
    return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const existing = await getOne('SELECT * FROM stages WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    await run('DELETE FROM stages WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stage:', error);
    return NextResponse.json({ error: 'Failed to delete stage' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { stages } = await request.json();

    if (!Array.isArray(stages)) {
      return NextResponse.json({ error: 'Stages array is required' }, { status: 400 });
    }

    for (const stage of stages) {
      await run(
        'UPDATE stages SET position = ? WHERE id = ?',
        [stage.position, stage.id]
      );
    }

    const updatedStages = await query('SELECT * FROM stages ORDER BY position ASC');
    return NextResponse.json(updatedStages);
  } catch (error) {
    console.error('Error reordering stages:', error);
    return NextResponse.json({ error: 'Failed to reorder stages' }, { status: 500 });
  }
}
