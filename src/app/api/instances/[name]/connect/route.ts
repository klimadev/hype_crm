import { NextRequest, NextResponse } from 'next/server';
import { connectInstance } from '@/lib/evolution/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  try {
    const result = await connectInstance(name);

    const instanceState = result.instance?.state || 'created';
    const hasQrcode = !!result.qrcode?.base64 || !!result.qrcode?.code;

    return NextResponse.json({
      connectionState: instanceState,
      qrcode: hasQrcode ? result.qrcode?.base64 : null,
      status: mapConnectionStatus(instanceState),
      ownerJid: result.instance?.instanceName,
    });
  } catch (error) {
    console.error('Error connecting instance:', error);
    return NextResponse.json(
      { error: 'Failed to connect instance' },
      { status: 500 }
    );
  }
}

function mapConnectionStatus(status: string): 'created' | 'connecting' | 'connected' | 'disconnected' | 'qrcode' {
  const statusMap: Record<string, 'created' | 'connecting' | 'connected' | 'disconnected' | 'qrcode'> = {
    'created': 'created',
    'connecting': 'connecting',
    'connected': 'connected',
    'open': 'connected',
    'close': 'disconnected',
    'disconnected': 'disconnected',
    'qrcode': 'qrcode',
  };

  return statusMap[status.toLowerCase()] || 'created';
}
