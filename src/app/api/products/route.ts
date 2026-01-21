import { NextRequest, NextResponse } from 'next/server';
import { query, run, getOne } from '@/lib/db';

export async function GET() {
  try {
    const products = await query(`
      SELECT * FROM products ORDER BY created_at DESC
    `);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, price, type, recurrence_type, instance_name } = await request.json();

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const result = await run(
      `INSERT INTO products (name, description, price, type, recurrence_type, instance_name) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description || null, price || 0, type, recurrence_type || 'none', instance_name || 'teste2']
    );

    const product = await getOne('SELECT * FROM products WHERE id = ?', [result.id]);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
