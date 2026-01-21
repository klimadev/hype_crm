export interface CreateInstanceRequest {
  instanceName: string;
  number?: string;
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS';
  qrcode?: boolean;
}

export interface InstanceResponse {
  instance: {
    instanceName: string;
    instanceId?: string;
    status: string;
    number?: string;
    integration: string;
  };
  hash: {
    token?: string;
    apikey?: string;
  };
  settings: Record<string, unknown>;
}

export interface ConnectionState {
  instance: {
    instanceName: string;
    state: 'open' | 'close' | 'connecting' | 'disconnected';
  };
}

export interface QrCodeResponse {
  base64?: string;
  code?: string;
}

export interface EvolutionInstance {
  name: string;
  number?: string | null;
  status: 'created' | 'connecting' | 'connected' | 'disconnected' | 'qrcode';
  integration: string;
  connectionState?: 'open' | 'close' | 'connecting' | 'disconnected';
  qrcode?: string;
  profileName?: string | null;
  ownerJid?: string | null;
  profilePicUrl?: string | null;
}

export type InstanceStatus = 'created' | 'connecting' | 'connected' | 'disconnected' | 'qrcode';
