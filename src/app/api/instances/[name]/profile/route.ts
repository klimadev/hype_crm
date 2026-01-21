import { NextRequest, NextResponse } from 'next/server';
import { getInstance } from '@/lib/evolution/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    
    const apiKey = request.headers.get('x-api-key');
    const hasAuth = await getServerSession(authOptions);
    
    if (!apiKey && !hasAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const instance = await getInstance(name);

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    const ownerJid = instance.ownerJid || null;
    const phoneNumber = ownerJid ? ownerJid.replace('@s.whatsapp.net', '') : null;

    return NextResponse.json({
      name: instance.name,
      profileName: instance.profileName || null,
      phoneNumber,
      ownerJid,
      profilePicUrl: instance.profilePicUrl || null,
      connectionStatus: instance.connectionStatus,
    });
  } catch (error) {
    console.error('Error fetching instance profile:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
