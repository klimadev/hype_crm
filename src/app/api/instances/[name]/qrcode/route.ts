import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  
  return NextResponse.json({
    error: 'QR code is only available at instance creation time',
    message: 'Recreate the instance to get a new QR code',
  }, { status: 410 });
}
