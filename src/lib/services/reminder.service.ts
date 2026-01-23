import { ScheduledReminderStatus, Lead } from '@/types';

// Status constants
export const REMINDER_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  PAUSED: 'paused'
} as const;

export type ReminderStatus = typeof REMINDER_STATUS[keyof typeof REMINDER_STATUS];

// Status configuration for UI
export const STATUS_CONFIG = {
  [REMINDER_STATUS.PENDING]: {
    label: 'Pendente',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200'
  },
  [REMINDER_STATUS.SENT]: {
    label: 'Enviado',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200'
  },
  [REMINDER_STATUS.FAILED]: {
    label: 'Falhou',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200'
  },
  [REMINDER_STATUS.CANCELLED]: {
    label: 'Cancelado',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200'
  },
  [REMINDER_STATUS.PAUSED]: {
    label: 'Pausado',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200'
  }
} as const;

// Template variable definitions
export const TEMPLATE_VARIABLES = {
  leadName: {
    name: 'leadName',
    label: 'Nome do Lead',
    description: 'Nome completo do lead'
  },
  leadPhone: {
    name: 'leadPhone',
    label: 'Telefone do Lead',
    description: 'Telefone do lead'
  },
  productName: {
    name: 'productName',
    label: 'Nome do Produto',
    description: 'Nome do produto associado'
  },
  stageName: {
    name: 'stageName',
    label: 'Nome do Estágio',
    description: 'Nome do estágio atual'
  }
} as const;

export const VALID_TEMPLATE_VARIABLES = Object.keys(TEMPLATE_VARIABLES);

// Interface for template context
export interface MessageContext {
  leadName: string;
  leadPhone: string;
  productName?: string;
  stageName?: string;
}

// Main service class
export class ReminderService {
  /**
   * Resolve template variables in message content
   */
  static resolveMessageTemplate(template: string, context: MessageContext): string {
    return template
      .replace(/{{leadName}}/g, context.leadName)
      .replace(/{{leadPhone}}/g, context.leadPhone)
      .replace(/{{productName}}/g, context.productName || 'N/A')
      .replace(/{{stageName}}/g, context.stageName || 'N/A');
  }

  /**
   * Validate template and extract variables
   */
  static validateTemplate(template: string): { valid: boolean; variables: string[] } {
    const regex = /{{(\w+)}}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    const invalidVariables = variables.filter(v => !VALID_TEMPLATE_VARIABLES.includes(v));

    return {
      valid: invalidVariables.length === 0,
      variables,
    };
  }

  /**
   * Get template variables info for helper components
   */
  static getTemplateVariables() {
    return Object.values(TEMPLATE_VARIABLES);
  }

  /**
   * Format UNIX timestamp to localized date string
   */
  static formatReminderDate(timestamp: number | string, options?: {
    includeTime?: boolean;
    locale?: string;
  }): string {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    
    if (!ts || ts <= 0) {
      return 'Não definida';
    }

    const date = new Date(ts * 1000);
    const locale = options?.locale || 'pt-BR';
    
    if (options?.includeTime) {
      return date.toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Get status configuration for UI components
   */
  static getStatusConfig(status: ScheduledReminderStatus | string) {
    return STATUS_CONFIG[status as ReminderStatus] || STATUS_CONFIG[REMINDER_STATUS.PENDING];
  }

  /**
   * Check if status is a valid reminder status
   */
  static isValidStatus(status: string): status is ReminderStatus {
    return Object.values(REMINDER_STATUS).includes(status as ReminderStatus);
  }

  /**
   * Create message context from lead data
   */
  static createContextFromLead(lead: Lead): MessageContext {
    return {
      leadName: lead.name,
      leadPhone: lead.phone,
      productName: lead.product_name || undefined,
      stageName: lead.stage_name || undefined
    };
  }

  /**
   * Validate reminder data for creation/update
   */
  static validateReminderData(data: {
    lead_id?: number;
    product_id?: number;
    message?: string;
    scheduled_at?: string | number;
    instance_name?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.lead_id !== undefined && (!data.lead_id || data.lead_id <= 0)) {
      errors.push('ID do lead é inválido');
    }

    if (data.product_id !== undefined && (!data.product_id || data.product_id <= 0)) {
      errors.push('ID do produto é inválido');
    }

    if (data.message !== undefined && (!data.message || data.message.trim().length === 0)) {
      errors.push('Mensagem não pode estar vazia');
    }

    if (data.instance_name !== undefined && (!data.instance_name || data.instance_name.trim().length === 0)) {
      errors.push('Nome da instância não pode estar vazio');
    }

    if (data.scheduled_at !== undefined) {
      const timestamp = typeof data.scheduled_at === 'string' 
        ? parseInt(data.scheduled_at, 10) 
        : data.scheduled_at;
      
      if (!timestamp || timestamp <= 0) {
        errors.push('Data de agendamento é inválida');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a timestamp is in the past
   */
  static isPastTimestamp(timestamp: number | string): boolean {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    return ts <= Math.floor(Date.now() / 1000);
  }

  /**
   * Calculate time remaining until timestamp
   */
  static getTimeRemaining(timestamp: number | string): {
    days: number;
    hours: number;
    minutes: number;
    totalMinutes: number;
    isPast: boolean;
  } {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    const now = Math.floor(Date.now() / 1000);
    const diff = ts - now;
    
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, totalMinutes: 0, isPast: true };
    }

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const totalMinutes = Math.floor(diff / 60);

    return { days, hours, minutes, totalMinutes, isPast: false };
  }
}