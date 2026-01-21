import { NextRequest, NextResponse } from 'next/server';
import { run, getOne } from '@/lib/db';
import { Product } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getOne('SELECT * FROM products WHERE id = ?', [parseInt(id)]);
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, price, type, recurrence_type, instance_name } = await request.json();

    const existingProduct = await getOne<Product>('SELECT * FROM products WHERE id = ?', [parseInt(id)]);
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await run(
      `UPDATE products SET name = ?, description = ?, price = ?, type = ?, recurrence_type = ?, instance_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        name ?? existingProduct.name,
        description ?? existingProduct.description,
        price ?? existingProduct.price,
        type ?? existingProduct.type,
        recurrence_type ?? existingProduct.recurrence_type ?? 'none',
        instance_name ?? existingProduct.instance_name ?? 'teste2',
        parseInt(id)
      ]
    );

    const product = await getOne('SELECT * FROM products WHERE id = ?', [parseInt(id)]);
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingProduct = await getOne('SELECT * FROM products WHERE id = ?', [parseInt(id)]);
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await run('DELETE FROM products WHERE id = ?', [parseInt(id)]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
