import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { handleStageEntry, checkTimeouts } from '@/lib/services/whatsapp-events';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId, stageId } = await request.json();

    if (!leadId || !stageId || typeof leadId !== 'number' || typeof stageId !== 'number') {
      return NextResponse.json({ error: 'leadId and stageId are required and must be numbers' }, { status: 400 });
    }

    await handleStageEntry(leadId, stageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering WhatsApp events:', error);
    return NextResponse.json({ error: 'Failed to trigger WhatsApp events' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await checkTimeouts();
    return NextResponse.json({ success: true, message: 'Timeout check completed' });
  } catch (error) {
    console.error('Error checking timeouts:', error);
    return NextResponse.json({ error: 'Failed to check timeouts' }, { status: 500 });
  }
}
