const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8888';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

interface SendMessageRequest {
  phone: string;
  message: string;
}

export async function sendWhatsAppMessage({ phone, message }: SendMessageRequest): Promise<boolean> {
  try {
    const cleanedPhone = phone.replace(/\D/g, '');
    
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/default`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        phone: cleanedPhone,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`EvolutionAPI error: ${response.status} - ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}
