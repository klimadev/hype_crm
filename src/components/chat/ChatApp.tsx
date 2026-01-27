'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatList } from './ChatList';
import { ChatThread } from './ChatThread';
import { MOCK_CHATS, Chat, Message, MessageType } from './mock-chat-data';
import { MessageSquare, Settings, Search, Plus, Info } from 'lucide-react';

/**
 * COMPONENTE PRINCIPAL CHAT APP
 * 
 * Gerencia o estado global das conversas e a navegação responsiva.
 * 
 * ESTRUTURA PARA EVOLUTION API:
 * - O estado 'chats' deve ser sincronizado via WebSocket ou pooling constante.
 * - 'setSelectedChatId' deve carregar o histórico de mensagens sob demanda se não estiver em cache.
 */

export default function ChatApp() {
  const [chats, setChats] = useState<Chat[]>(MOCK_CHATS);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedChat = chats.find((c: Chat) => c.id === selectedChatId);

  const handleSendMessage = (text: string, type: MessageType = 'text', file?: File) => {
    if (!selectedChatId) return;

    const newMessageAt = Math.floor(Date.now() / 1000);
    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      text,
      type,
      sender: 'me',
      timestamp: newMessageAt,
      status: 'sending',
      fileName: file?.name,
      fileSize: file ? `${(file.size / 1024).toFixed(0)} KB` : undefined,
      mediaUrl: file ? URL.createObjectURL(file) : undefined,
      duration: type === 'audio' || type === 'ptt' ? '0:05' : undefined,
      isPtt: type === 'ptt'
    };

    const lastMsgPreview = type === 'text' ? text : 
                          type === 'image' ? '📷 Foto' :
                          type === 'video' ? '🎥 Vídeo' :
                          type === 'document' ? '📄 Documento' : '🎙️ Áudio';

    setChats((prevChats: Chat[]) =>
      prevChats.map((chat) => {
        if (chat.id === selectedChatId) {
          return {
            ...chat,
            lastMessage: lastMsgPreview || chat.lastMessage,
            lastMessageAt: newMessageAt,
            messages: [...chat.messages, newMessage],
          };
        }
        return chat;
      })
    );

    // Simulate status update
    setTimeout(() => {
      setChats((prev: Chat[]) => prev.map(c => ({
        ...c,
        messages: c.messages.map((m: Message) => m.id === newMessage.id ? { ...m, status: 'sent' } : m)
      })));
    }, 1000);

    // Mock response simulation
    if (type === 'text') {
      setTimeout(() => {
        const responseMsg: Message = {
          id: Math.random().toString(36).substring(7),
          text: 'Entendido! Como posso ajudar mais?',
          type: 'text',
          sender: 'contact',
          timestamp: Math.floor(Date.now() / 1000),
          status: 'read',
        };

        setChats((prevChats: Chat[]) =>
          prevChats.map((chat) => {
            if (chat.id === selectedChatId) {
              return {
                ...chat,
                lastMessage: responseMsg.text || chat.lastMessage,
                lastMessageAt: responseMsg.timestamp,
                messages: [...chat.messages, responseMsg],
                unreadCount: chat.unreadCount + 1
              };
            }
            return chat;
          })
        );
      }, 3000);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-zinc-950 overflow-hidden relative">
      {/* Left Sidebar */}
      <div 
        className={`${
          isMobile && selectedChatId ? 'hidden' : 'flex'
        } w-full md:w-[350px] lg:w-[400px] flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950`}
      >
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-100 dark:bg-zinc-900">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Mensagens</h1>
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"><Plus className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"><Settings className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-zinc-950">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" placeholder="Pesquisar..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <ChatList
            chats={chats}
            selectedChatId={selectedChatId}
            onSelectChat={(chat: Chat) => {
              setSelectedChatId(chat.id);
              // Clear unread in mock
              setChats((prev: Chat[]) => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className={`${isMobile && !selectedChatId ? 'hidden' : 'flex'} flex-1 flex-col bg-white dark:bg-zinc-950`}>
        <AnimatePresence mode="wait">
          {selectedChat ? (
            <motion.div key={selectedChat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col h-full">
              <ChatThread 
                chat={selectedChat} 
                onSendMessage={handleSendMessage}
                onBack={isMobile ? () => setSelectedChatId(undefined) : undefined}
              />
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#f0f2f5] dark:bg-zinc-950">
              <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-8 shadow-sm">
                <MessageSquare className="w-10 h-10 text-zinc-400" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">WhatsApp Hype</h2>
              <p className="max-w-md text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                Envie e receba mensagens sem precisar manter seu celular conectado.<br/>Use o WhatsApp em até 4 dispositivos simultâneos.
              </p>
              <div className="mt-auto flex items-center gap-2 text-zinc-400 text-xs">
                <Info className="w-4 h-4" />
                <span>Criptografado de ponta a ponta</span>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
      `}</style>
    </div>
  );
}
