import { sendTextMessage } from '@/lib/evolution/client';

export interface SendMessageRequest {
  instanceName: string;
  phone: string;
  message: string;
  presence?: 'composing' | 'recording';
}

export async function sendWhatsAppMessage({
  instanceName,
  phone,
  message,
  presence,
}: SendMessageRequest): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await sendTextMessage(instanceName, { phone, message, presence });

    return {
      success: true,
      messageId: response.key?.id,
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
    };
  }
}
