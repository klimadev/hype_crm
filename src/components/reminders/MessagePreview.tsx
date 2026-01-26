import { Eye, MessageSquare } from 'lucide-react';

interface MessagePreviewProps {
  message: string;
  leadName?: string;
  leadPhone?: string;
  productName?: string;
  stageName?: string;
}

export function MessagePreview({
  message,
  leadName = 'João Silva',
  leadPhone = '(11) 99999-9999',
  productName = 'Nome do Produto',
  stageName = 'Estágio Atual',
}: MessagePreviewProps) {
  const replaceVariables = (msg: string): string => {
    return msg
      .replace(/\{\{leadName\}\}/g, leadName)
      .replace(/\{\{leadPhone\}\}/g, leadPhone)
      .replace(/\{\{productName\}\}/g, productName)
      .replace(/\{\{stageName\}\}/g, stageName);
  };

  const hasVariables = /\{\{leadName\}\}|\{\{leadPhone\}\}|\{\{productName\}\}|\{\{stageName\}\}/.test(message);
  const previewText = replaceVariables(message);

  if (!message.trim()) {
    return (
      <div className="mt-3 p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
        <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
          <Eye className="w-4 h-4" />
          <span className="text-sm">Digite uma mensagem para ver a pré-visualização</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-4 h-4 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Como o cliente receberá:
        </span>
      </div>
      <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {leadName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                {leadName}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {leadPhone}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {previewText}
            </p>
          </div>
        </div>
      </div>
      {hasVariables && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
          As variáveis serão substituídas pelos dados reais do lead
        </p>
      )}
    </div>
  );
}
