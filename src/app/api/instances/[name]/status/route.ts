import { NextRequest, NextResponse } from 'next/server';
import { getInstance } from '@/lib/evolution/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  
  try {
    const instance = await getInstance(name);
    
    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      status: mapConnectionStatus(instance.connectionStatus),
      connectionState: instance.connectionStatus,
    });
  } catch (error) {
    console.error('Error fetching instance status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instance status' },
      { status: 500 }
    );
  }
}

function mapConnectionStatus(status: string): 'created' | 'connecting' | 'connected' | 'disconnected' | 'qrcode' {
  const statusMap: Record<string, 'created' | 'connecting' | 'connected' | 'disconnected' | 'qrcode'> = {
    'created': 'created',
    'connecting': 'connecting',
    'connected': 'connected',
    'close': 'disconnected',
    'disconnected': 'disconnected',
    'qrcode': 'qrcode',
  };
  
  return statusMap[status.toLowerCase()] || 'created';
}
