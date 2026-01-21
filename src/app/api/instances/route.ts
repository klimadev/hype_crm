import { NextRequest, NextResponse } from 'next/server';
import { createInstance, listInstances, InstanceListItem, getInstanceStatus } from '@/lib/evolution/client';

export async function GET() {
  try {
    const instances = await listInstances();
    
    const formattedInstances = await Promise.all(
      instances
        .filter((inst): inst is InstanceListItem => 
          inst !== null && 
          inst !== undefined && 
          inst.name !== undefined && 
          inst.name !== null &&
          typeof inst.name === 'string'
        )
        .map(async (inst) => {
          let connectionStatus = mapConnectionStatus(inst.connectionStatus);
          
          if (!inst.connectionStatus || connectionStatus === 'created') {
            console.log(`[instances] Fetching individual status for ${inst.name}, current: ${inst.connectionStatus}`);
            const individualStatus = await getInstanceStatus(inst.name);
            if (individualStatus) {
              const mappedStatus = mapConnectionStatus(individualStatus);
              console.log(`[instances] Individual status for ${inst.name}: ${individualStatus} -> ${mappedStatus}`);
              connectionStatus = mappedStatus;
            } else {
              console.log(`[instances] Failed to get individual status for ${inst.name}`);
            }
          }
          
          return {
            name: inst.name,
            number: inst.ownerJid ? inst.ownerJid.replace('@s.whatsapp.net', '') : inst.number,
            status: connectionStatus,
            connectionStatus,
            integration: inst.integration,
            profileName: inst.profileName,
            ownerJid: inst.ownerJid,
            profilePicUrl: inst.profilePicUrl,
          };
        })
    );
    
    return NextResponse.json(formattedInstances);
  } catch (error) {
    console.error('Error fetching instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instances' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instanceName, number, integration } = body;
    
    if (!instanceName || instanceName.trim() === '') {
      return NextResponse.json(
        { error: 'Instance name is required' },
        { status: 400 }
      );
    }
    
    const result = await createInstance({
      instanceName: instanceName.trim(),
      number,
      integration,
    });
    
    return NextResponse.json({
      name: result.instance.instanceName,
      number: result.instance.number,
      status: 'qrcode',
      connectionStatus: 'qrcode',
      integration: result.instance.integration,
      qrcode: result.qrcode?.base64,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating instance:', error);
    
    const evolutionError = error as { status?: number; response?: { message?: string[] } };
    
    if (evolutionError.status === 409) {
      return NextResponse.json(
        { error: 'Instance with this name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create instance', details: evolutionError.response?.message },
      { status: 500 }
    );
  }
}

function mapStatus(status: string | null | undefined): 'created' | 'connecting' | 'connected' | 'disconnected' | 'qrcode' {
  if (!status) {
    console.log('[instances] Status is null/undefined, fetching individual status...');
    return 'created';
  }
  
  const statusMap: Record<string, 'created' | 'connecting' | 'connected' | 'disconnected' | 'qrcode'> = {
    'created': 'created',
    'connecting': 'connecting',
    'open': 'connected',
    'connected': 'connected',
    'close': 'disconnected',
    'disconnected': 'disconnected',
    'qrcode': 'qrcode',
  };
  
  const mapped = statusMap[status.toLowerCase()];
  if (!mapped) {
    console.log(`[instances] Unknown status: ${status}, defaulting to 'created'`);
  }
  return mapped || 'created';
}

function mapConnectionStatus(status: string | null | undefined): 'created' | 'connecting' | 'connected' | 'disconnected' | 'qrcode' {
  return mapStatus(status);
}
