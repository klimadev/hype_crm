'use client';

import { Chat } from './mock-chat-data';
import { Check, CheckCheck } from 'lucide-react';

interface ChatListProps {
  chats: Chat[];
  selectedChatId?: string;
  onSelectChat: (chat: Chat) => void;
}

export function ChatList({ chats, selectedChatId, onSelectChat }: ChatListProps) {
  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp * 1000));
  };

  return (
    <div className="flex flex-col">
      {chats.sort((a, b) => b.lastMessageAt - a.lastMessageAt).map((chat) => {
        const isSelected = selectedChatId === chat.id;
        
        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`flex items-center gap-4 p-4 transition-all duration-200 border-b border-zinc-50 dark:border-zinc-900/50 text-left ${
              isSelected 
                ? 'bg-indigo-50/50 dark:bg-indigo-900/10' 
                : 'hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40'
            }`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg shadow-black/5 ${
                chat.isOnline ? 'bg-gradient-to-br from-indigo-500 to-violet-600' : 'bg-zinc-400 dark:bg-zinc-700'
              }`}>
                {chat.contactName.charAt(0)}
              </div>
              {chat.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className={`text-sm font-bold truncate ${
                  isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'
                }`}>
                  {chat.contactName}
                </h3>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                  {formatTime(chat.lastMessageAt)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  {chat.messages[chat.messages.length - 1]?.sender === 'me' && (
                    <CheckCheck className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  )}
                  <p className={`text-xs truncate ${
                    chat.unreadCount > 0 ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {chat.lastMessage}
                  </p>
                </div>
                
                {chat.unreadCount > 0 && (
                  <div className="bg-indigo-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
