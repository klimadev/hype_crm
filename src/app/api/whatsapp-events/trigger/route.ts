import { NextRequest, NextResponse } from 'next/server';
import { handleStageEntry, checkTimeouts } from '@/lib/services/whatsapp-events';

export async function POST(request: NextRequest) {
  try {
    const { leadId, stageId } = await request.json();

    if (!leadId || !stageId) {
      return NextResponse.json({ error: 'leadId and stageId are required' }, { status: 400 });
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
    await checkTimeouts();
    return NextResponse.json({ success: true, message: 'Timeout check completed' });
  } catch (error) {
    console.error('Error checking timeouts:', error);
    return NextResponse.json({ error: 'Failed to check timeouts' }, { status: 500 });
  }
}
