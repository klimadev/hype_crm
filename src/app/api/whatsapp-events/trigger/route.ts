import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { handleStageEntry, checkTimeouts } from '@/lib/services/whatsapp-events';

function logRequest(method: string, url: string, body?: Record<string, unknown>) {
  console.log(`[WhatsApp Trigger] 📥 ${method} ${url}`, body ? JSON.stringify(body) : '');
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    logRequest('POST', '/api/whatsapp-events/trigger');

    const { leadId, stageId } = await request.json();
    
    console.log(`[WhatsApp Trigger] 📋 leadId: ${leadId}, stageId: ${stageId}`);

    if (!leadId || !stageId || typeof leadId !== 'number' || typeof stageId !== 'number') {
      console.error(`[WhatsApp Trigger] ❌ Validation failed: leadId=${leadId}, stageId=${stageId}`);
      return NextResponse.json({ error: 'leadId and stageId are required and must be numbers' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      console.warn(`[WhatsApp Trigger] ⚠️ No session - allowing internal request (leadId=${leadId}, stageId=${stageId})`);
    }

    console.log(`[WhatsApp Trigger] 🔄 Calling handleStageEntry for lead ${leadId}, stage ${stageId}...`);
    await handleStageEntry(leadId, stageId);
    console.log(`[WhatsApp Trigger] ✅ handleStageEntry completed in ${Date.now() - startTime}ms`);

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error(`[WhatsApp Trigger] ❌ Error in ${Date.now() - startTime}ms:`, errorMessage);
    console.error(`[WhatsApp Trigger] 📍 Stack:`, errorStack);
    
    return NextResponse.json({ error: 'Failed to trigger WhatsApp events', details: errorMessage }, { status: 500 });
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
