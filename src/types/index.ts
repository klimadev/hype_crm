export interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  stage_id: number | null;
  product_id: number | null;
  stage_name: string | null;
  product_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Stage {
  id: number;
  name: string;
  color: string;
  position: number;
  product_id: number | null;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  type: 'product' | 'service';
  recurrence_type: RecurrenceType;
  instance_name: string | null;
  created_at: string;
  updated_at: string;
}

export type RecurrenceType = 
  | 'none' 
  | 'minute_30' 
  | 'hour_1' 
  | 'hour_2' 
  | 'hour_4' 
  | 'hour_8' 
  | 'day_1' 
  | 'day_3' 
  | 'day_7' 
  | 'day_15' 
  | 'day_30' 
  | 'day_60' 
  | 'day_90' 
  | 'month_1' 
  | 'month_2' 
  | 'month_3' 
  | 'month_6';

export type DelayUnit = 'minute' | 'hour' | 'day' | 'week' | 'month';

export type ReminderMode = 'once' | 'recurring';

export interface ProductReminder {
  id: number;
  product_id: number;
  stage_id: number;
  stage_name: string | null;
  delay_value: number;
  delay_unit: DelayUnit;
  reminder_mode: ReminderMode;
  instance_name: string | null;
  message: string;
  is_active: number;
  created_at: string;
}

export interface CreateReminderData {
  stage_id: number;
  delay_value: number;
  delay_unit: DelayUnit;
  reminder_mode: ReminderMode;
  instance_name?: string;
  message: string;
  is_active?: boolean;
}

export interface UpdateReminderData {
  stage_id?: number;
  delay_value?: number;
  delay_unit?: DelayUnit;
  reminder_mode?: ReminderMode;
  instance_name?: string;
  message?: string;
  is_active?: boolean;
}

export interface KanbanCardProps {
  lead: Lead;
  onDragStart: (e: React.DragEvent, leadId: number) => void;
  formatPhone: (phone: string) => string;
  formatDate: (dateString: string) => string;
  isDragging?: boolean;
}

export interface StageManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export interface FilterOptions {
  search: string;
  stageIds: number[];
  productIds: number[];
  status: string[];
  dateFrom: string | null;
  dateTo: string | null;
}

export interface LeadFilters {
  search?: string;
  stage_id?: number | number[];
  product_id?: number | number[];
  status?: string | string[];
  date_from?: string;
  date_to?: string;
}

export interface CreateLeadData {
  name: string;
  phone: string;
  email?: string;
  product_id?: number;
  stage_id?: number;
}

export interface UpdateLeadData {
  name?: string;
  phone?: string;
  email?: string;
  stage_id?: number;
  product_id?: number;
  status?: string;
}

export interface CreateStageData {
  name: string;
  color?: string;
  position?: number;
}

export interface UpdateStageData {
  id: number;
  name?: string;
  color?: string;
  position?: number;
}

export type ScheduledReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled' | 'paused';

export interface ReminderLog {
  id: number;
  lead_id: number;
  product_id: number;
  reminder_id: number;
  scheduled_at: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  message_preview: string | null;
  next_scheduled_at: string | null;
  error: string | null;
  created_at: string;
  lead_name?: string;
  product_name?: string;
}

export interface ReminderStats {
  pending: number;
  sent_today: number;
  next_reminder: {
    lead_name: string;
    product_name: string;
    time_remaining: string;
    message_preview: string;
  } | null;
}

export const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  CONVERTED: 'converted',
  LOST: 'lost',
} as const;

export type LeadStatus = typeof LEAD_STATUS[keyof typeof LEAD_STATUS];

export const STAGE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
];

export const DATE_RANGE_PRESETS = {
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  CUSTOM: 'custom',
} as const;

export type DateRangePreset = typeof DATE_RANGE_PRESETS[keyof typeof DATE_RANGE_PRESETS];
