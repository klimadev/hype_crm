import { User, Phone, Package, MapPin } from 'lucide-react';

interface Variable {
  key: string;
  label: string;
  description: string;
  icon: 'user' | 'phone' | 'product' | 'stage';
}

const VARIABLES: Variable[] = [
  {
    key: '{{leadName}}',
    label: 'Nome',
    description: 'Nome do cliente lead',
    icon: 'user',
  },
  {
    key: '{{leadPhone}}',
    label: 'Telefone',
    description: 'Número de WhatsApp do cliente',
    icon: 'phone',
  },
  {
    key: '{{productName}}',
    label: 'Produto',
    description: 'Nome do produto/serviço',
    icon: 'product',
  },
  {
    key: '{{stageName}}',
    label: 'Estágio',
    description: 'Nome do estágio atual',
    icon: 'stage',
  },
];

interface MessageVariablesHelperProps {
  onInsertVariable: (variable: string) => void;
}

export function MessageVariablesHelper({ onInsertVariable }: MessageVariablesHelperProps) {
  const getIcon = (iconType: Variable['icon']) => {
    switch (iconType) {
      case 'user':
        return <User className="w-3.5 h-3.5" />;
      case 'phone':
        return <Phone className="w-3.5 h-3.5" />;
      case 'product':
        return <Package className="w-3.5 h-3.5" />;
      case 'stage':
        return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 self-center mr-1">
        Clique para inserir:
      </span>
      {VARIABLES.map((variable) => (
        <button
          key={variable.key}
          type="button"
          onClick={() => onInsertVariable(variable.key)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-all group"
          title={variable.description}
        >
          <span className="text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300">
            {getIcon(variable.icon)}
          </span>
          <span className="text-blue-600 dark:text-blue-400">{variable.label}</span>
          <code className="text-[10px] px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-400 font-mono">
            {variable.key}
          </code>
        </button>
      ))}
    </div>
  );
}
