'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chat, Message, MessageType } from './mock-chat-data';
import { 
  Send, ChevronLeft, MoreVertical, Paperclip, Smile, Check, CheckCheck, Clock,
  Image as ImageIcon, File as FileIcon, Music as AudioIcon, Video as VideoIcon,
  X, Download, FileText, Play, Pause, Mic, Trash2
} from 'lucide-react';

/**
 * COMPONENTE CHAT THREAD (MOCKUP)
 * 
 * Este componente gerencia a visualização da conversa e o envio de mensagens.
 * 
 * GUIA DE INTEGRAÇÃO EVOLUTION API:
 * - Mensagens Enviadas: Ao disparar 'handleSend', chamar o endpoint POST /message/sendText ou /message/sendMedia.
 * - Recebimento: Escutar webhooks 'messages.upsert' e atualizar o estado do chat pai.
 * - Mídias: Para arquivos, a Evolution espera base64 ou uma URL pública.
 * - PTT: Áudios gravados devem ser enviados com o parâmetro 'ptt: true'.
 */

export interface ChatThreadProps {
  chat: Chat;
  onSendMessage: (text: string, type?: MessageType, file?: File) => void;
  onBack?: () => void;
}

export function ChatThread({ chat, onSendMessage, onBack }: ChatThreadProps) {
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ 
    file: File, 
    type: MessageType, 
    preview?: string,
    metadata?: { duration?: string } 
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  const handleSend = () => {
    if (inputText.trim() || pendingFile) {
      onSendMessage(inputText.trim(), pendingFile?.type || 'text', pendingFile?.file);
      setInputText('');
      setPendingFile(null);
    }
  };

  const handleFileSelect = (type: MessageType) => {
    setShowAttachMenu(false);
    if (fileInputRef.current) {
      const accepts: Record<string, string> = {
        image: 'image/*',
        video: 'video/*',
        audio: 'audio/*',
        document: '.pdf,.doc,.docx,.xls,.xlsx,.txt'
      };
      fileInputRef.current.accept = accepts[type] || '*/*';
      fileInputRef.current.setAttribute('data-type', type);
      fileInputRef.current.click();
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = e.target.getAttribute('data-type') as MessageType || 'document';
    
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPendingFile({ file, type, preview: url });
    } else {
      setPendingFile({ file, type });
    }
    e.target.value = '';
  };

  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp * 1000));
  };

  return (
    <div className="flex flex-col h-full bg-[#efeae2] dark:bg-zinc-950 relative overflow-hidden">
      {/* Background WhatsApp style */}
      <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat" />

      {/* Header */}
      <header className="z-30 h-16 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full md:hidden">
              <ChevronLeft className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-zinc-300 dark:bg-zinc-800 flex items-center justify-center font-bold text-white overflow-hidden shadow-sm">
            {chat.avatarUrl ? <img src={chat.avatarUrl} className="w-full h-full object-cover" /> : chat.contactName.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">{chat.contactName}</h3>
            <p className="text-[11px] text-zinc-500 font-medium">{chat.isOnline ? 'Online' : 'Visto por último hoje'}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full text-zinc-500"><MoreVertical className="w-5 h-5" /></button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar z-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          {chat.messages.map((message) => {
            const isMe = message.sender === 'me';
            return (
              <div key={message.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[85%] md:max-w-[65%] shadow-sm rounded-lg p-1 ${
                  isMe ? 'bg-[#d9fdd3] dark:bg-indigo-900/40 rounded-tr-none' : 'bg-white dark:bg-zinc-900 rounded-tl-none'
                }`}>
                  
                  {/* Image Rendering */}
                  {message.type === 'image' && (
                    <div className="flex flex-col">
                      <img src={message.mediaUrl} className="rounded-md max-h-72 object-cover cursor-pointer" />
                      {message.text && <p className="text-[13px] px-2 py-1.5 dark:text-zinc-200">{message.text}</p>}
                    </div>
                  )}

                  {/* Video Rendering */}
                  {message.type === 'video' && (
                    <div className="relative group cursor-pointer">
                      <video src={message.mediaUrl} className="rounded-md max-h-72 w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"><Play fill="white" className="w-6 h-6" /></div>
                      </div>
                      {message.duration && <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded">{message.duration}</span>}
                    </div>
                  )}

                  {/* Document Rendering */}
                  {message.type === 'document' && (
                    <div className={`flex items-center gap-3 p-2 rounded ${isMe ? 'bg-black/5' : 'bg-zinc-50 dark:bg-zinc-800'}`}>
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded flex items-center justify-center text-indigo-600"><FileText className="w-6 h-6" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate dark:text-zinc-200">{message.fileName}</p>
                        <p className="text-[10px] text-zinc-500 uppercase">{message.fileSize}</p>
                      </div>
                      <Download className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}

                  {/* Audio/PTT Rendering */}
                  {(message.type === 'audio' || message.type === 'ptt') && (
                    <div className="flex items-center gap-3 p-2 min-w-[240px]">
                      {message.isPtt && !isMe && (
                        <div className="relative">
                          <img src={chat.avatarUrl || "https://ui-avatars.com/api/?name="+chat.contactName} className="w-10 h-10 rounded-full" />
                          <Mic className="absolute -bottom-1 -right-1 w-4 h-4 text-indigo-500 bg-white dark:bg-zinc-900 rounded-full p-0.5" />
                        </div>
                      )}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"><Play fill="currentColor" className="w-4 h-4" /></div>
                      <div className="flex-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full relative">
                        <div className="absolute inset-y-0 left-0 w-1/3 bg-indigo-500 rounded-full" />
                      </div>
                      <span className="text-[10px] text-zinc-500 font-medium">{message.duration || '0:00'}</span>
                    </div>
                  )}

                  {/* Text Rendering */}
                  {message.type === 'text' && <p className="text-[13.5px] px-2 py-1 leading-normal dark:text-zinc-200">{message.text}</p>}

                  {/* Meta Info */}
                  <div className="flex items-center justify-end gap-1 px-1 mt-1">
                    <span className="text-[10px] text-zinc-500 font-medium">{formatTime(message.timestamp)}</span>
                    {isMe && (
                      <span className={message.status === 'read' ? 'text-blue-500' : 'text-zinc-400'}>
                        {message.status === 'sending' ? <Clock className="w-3 h-3" /> : message.status === 'sent' ? <Check className="w-3 h-3" /> : <CheckCheck className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <footer className="z-40 bg-zinc-100 dark:bg-zinc-900 p-2 relative">
        <div className="max-w-4xl mx-auto flex items-end gap-2 px-2">
          
          {/* Attachment Preview Over input */}
          <AnimatePresence>
            {pendingFile && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="absolute bottom-full left-0 right-0 mb-4 mx-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 z-50">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm dark:text-white">Pré-visualização</h4>
                  <button onClick={() => setPendingFile(null)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl">
                  {pendingFile.type === 'image' ? <img src={pendingFile.preview} className="w-24 h-24 rounded-lg object-cover" /> :
                   pendingFile.type === 'video' ? <div className="relative w-24 h-24 bg-black rounded-lg flex items-center justify-center"><VideoIcon className="text-white" /><div className="absolute inset-0 flex items-center justify-center"><Play className="w-6 h-6 text-white" /></div></div> :
                   <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600"><FileIcon className="w-8 h-8" /></div>}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold truncate dark:text-zinc-200">{pendingFile.file.name}</p>
                    <p className="text-xs text-zinc-500 uppercase">{(pendingFile.file.size / 1024).toFixed(0)} KB • {pendingFile.type}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center gap-1 mb-1">
            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className={`p-2 rounded-full transition-all ${showAttachMenu ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}><Paperclip className="w-6 h-6" /></button>
            <button className="p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full"><Smile className="w-6 h-6" /></button>
          </div>

          {/* Attach Menu */}
          <AnimatePresence>
            {showAttachMenu && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-4 mb-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-2 border border-zinc-200 dark:border-zinc-700 z-50">
                {[
                  { icon: ImageIcon, label: 'Fotos e Vídeos', type: 'image', color: 'bg-blue-500' },
                  { icon: FileIcon, label: 'Documento', type: 'document', color: 'bg-indigo-500' },
                  { icon: VideoIcon, label: 'Câmera', type: 'video', color: 'bg-pink-500' },
                ].map(item => (
                  <button key={item.label} onClick={() => handleFileSelect(item.type as MessageType)} className="flex items-center gap-3 w-full p-3 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${item.color}`}><item.icon className="w-5 h-5" /></div>
                    <span className="text-sm font-medium dark:text-zinc-200">{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Textbox */}
          <div className="flex-1 bg-white dark:bg-zinc-800 rounded-xl p-1 mb-1">
            <textarea
              value={inputText} onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite uma mensagem" rows={1}
              className="w-full bg-transparent border-none focus:ring-0 text-sm py-2 px-3 resize-none max-h-32 dark:text-white"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
          </div>

          {/* Send or Mic */}
          <div className="mb-1">
            {inputText.trim() || pendingFile ? (
              <button onClick={handleSend} className="p-3 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700"><Send className="w-5 h-5" /></button>
            ) : (
              <button onMouseDown={() => setIsRecording(true)} onMouseUp={() => setIsRecording(false)} 
                className={`p-3 rounded-full shadow-md transition-all ${isRecording ? 'bg-red-500 scale-125' : 'bg-zinc-400 dark:bg-zinc-700 text-white'}`}><Mic className="w-5 h-5" /></button>
            )}
          </div>
        </div>
      </footer>

      <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} />
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
      `}</style>
    </div>
  );
}
