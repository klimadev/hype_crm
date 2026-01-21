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
  created_at: string;
  updated_at: string;
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
