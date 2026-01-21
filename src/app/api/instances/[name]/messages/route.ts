import { NextRequest, NextResponse } from 'next/server';
import { sendTextMessage } from '@/lib/evolution/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name: instanceName } = await params;

  try {
    const body = await request.json();
    const { phone, message, presence } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Phone and message are required' },
        { status: 400 }
      );
    }

    const response = await sendTextMessage(instanceName, { phone, message, presence });

    return NextResponse.json({
      success: true,
      messageId: response.key?.id,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to send message', details: errorMessage },
      { status: 500 }
    );
  }
}
