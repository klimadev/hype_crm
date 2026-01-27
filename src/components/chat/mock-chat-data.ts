/**
 * MOCK DATA & TYPES for Chat Module
 * 
 * Este arquivo define a estrutura de dados que a Evolution API deverá preencher.
 * 
 * INTEGRAÇÃO FUTURA:
 * 1. O campo 'id' deve mapear para o JID ou remoteJid da Evolution.
 * 2. O campo 'status' mapeia para os status de mensagem (0: PENDING, 1: SENDING, 2: SENT, 3: DELIVERED, 4: READ).
 * 3. Mensagens do tipo 'audio' com 'isPtt: true' são gravadas diretamente no WhatsApp.
 */

export type MessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'ptt';

export interface Message {
  id: string;
  text?: string;
  type: MessageType;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  duration?: string; // Para áudios e vídeos
  isPtt?: boolean;   // Se for áudio gravado na hora
  sender: 'me' | 'contact';
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface Chat {
  id: string;
  contactName: string;
  phone: string;
  lastMessage: string;
  lastMessageAt: number;
  unreadCount: number;
  avatarUrl?: string;
  isOnline?: boolean;
  messages: Message[];
}

export const MOCK_CHATS: Chat[] = [
  {
    id: '5511999999999@c.us',
    contactName: 'João Silva',
    phone: '+55 11 99999-9999',
    lastMessage: '🎙️ Áudio (0:15)',
    lastMessageAt: Math.floor(Date.now() / 1000) - 3600,
    unreadCount: 2,
    isOnline: true,
    messages: [
      {
        id: '1',
        text: 'Olá, segue o vídeo do produto e um áudio explicando.',
        type: 'text',
        sender: 'contact',
        timestamp: Math.floor(Date.now() / 1000) - 4000,
        status: 'read',
      },
      {
        id: 'v1',
        type: 'video',
        mediaUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
        text: 'Demonstração de uso',
        sender: 'contact',
        timestamp: Math.floor(Date.now() / 1000) - 3800,
        status: 'read',
        duration: '0:30'
      },
      {
        id: 'a1',
        type: 'audio',
        isPtt: true,
        mediaUrl: '#',
        duration: '0:15',
        sender: 'contact',
        timestamp: Math.floor(Date.now() / 1000) - 3600,
        status: 'read',
      },
    ],
  },
  {
    id: '5511888888888@c.us',
    contactName: 'Maria Oliveira',
    phone: '+55 11 88888-8888',
    lastMessage: 'Contrato_Assinado.pdf',
    lastMessageAt: Math.floor(Date.now() / 1000) - 86400,
    unreadCount: 0,
    isOnline: false,
    messages: [
      {
        id: '4',
        type: 'document',
        fileName: 'Contrato_Assinado.pdf',
        fileSize: '1.2 MB',
        sender: 'me',
        timestamp: Math.floor(Date.now() / 1000) - 86400,
        status: 'read',
      },
    ],
  },
];
