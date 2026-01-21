const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8888';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

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
  qrcode?: {
    base64?: string;
    code?: string;
  };
}

export interface InstanceListItem {
  id: string;
  name: string;
  connectionStatus: 'connecting' | 'connected' | 'close' | 'disconnected' | 'created' | 'qrcode';
  ownerJid?: string;
  profileName?: string;
  profilePicUrl?: string | null;
  integration: string;
  number?: string | null;
  businessId?: string | null;
  token?: string;
  disconnectionReasonCode?: number;
  disconnectionObject?: string | null;
  disconnectionAt?: string | null;
  createdAt: string;
  updatedAt: string;
  Setting?: {
    rejectCall: boolean;
    msgCall: string;
    groupsIgnore: boolean;
    alwaysOnline: boolean;
    readMessages: boolean;
    readStatus: boolean;
    syncFullHistory: boolean;
    wavoipToken: string;
    instanceId: string;
  };
  _count?: {
    Message: number;
    Contact: number;
    Chat: number;
  };
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

export interface ConnectResponse {
  instance?: {
    instanceName: string;
    state: 'open' | 'close' | 'connecting' | 'disconnected' | 'created' | 'qrcode';
  };
  qrcode?: {
    base64?: string;
    code?: string;
  };
}

export interface SendTextMessageRequest {
  phone: string;
  message: string;
  presence?: 'composing' | 'recording';
}

export interface SendTextMessageResponse {
  key: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  message?: {
    conversation?: string;
  };
}

export interface PresenceRequest {
  presence: 'online' | 'offline' | 'composing' | 'recording' | 'paused';
}

export interface EvolutionError {
  status: number;
  error: string;
  response?: {
    message?: string[];
  };
}

async function evolutionFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${EVOLUTION_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error: EvolutionError = {
      status: response.status,
      error: response.statusText,
    };
    
    try {
      const errorData = await response.json();
      error.response = errorData;
    } catch {
      error.response = { message: [response.statusText] };
    }
    
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export async function createInstance(data: CreateInstanceRequest): Promise<InstanceResponse> {
  return evolutionFetch<InstanceResponse>('/instance/create', {
    method: 'POST',
    body: JSON.stringify({
      instanceName: data.instanceName,
      number: data.number?.replace(/\D/g, ''),
      integration: data.integration || 'WHATSAPP-BAILEYS',
      qrcode: true,
    }),
  });
}

export async function listInstances(): Promise<InstanceListItem[]> {
  return evolutionFetch<InstanceListItem[]>('/instance/fetchInstances');
}

export async function getInstance(instanceName: string): Promise<InstanceListItem | null> {
  try {
    const instances = await listInstances();
    return instances.find(i => i.name === instanceName) || null;
  } catch {
    return null;
  }
}

export async function deleteInstance(instanceName: string): Promise<boolean> {
  try {
    await evolutionFetch(`/instance/delete/${instanceName}`, {
      method: 'DELETE',
    });
    return true;
  } catch {
    return false;
  }
}

export async function connectInstance(instanceName: string): Promise<ConnectResponse> {
  return evolutionFetch<ConnectResponse>(`/instance/connect/${instanceName}`, {
    method: 'GET',
  });
}

export async function logoutInstance(instanceName: string): Promise<boolean> {
  try {
    await evolutionFetch(`/instance/logout/${instanceName}`, {
      method: 'DELETE',
    });
    return true;
  } catch {
    return false;
  }
}

export async function setPresence(instanceName: string, presence: string): Promise<void> {
  await evolutionFetch(`/instance/setPresence/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({ presence }),
  });
}

export async function sendTextMessage(
  instanceName: string,
  data: SendTextMessageRequest
): Promise<SendTextMessageResponse> {
  return evolutionFetch<SendTextMessageResponse>(`/message/sendText/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number: data.phone.replace(/\D/g, ''),
      text: data.message,
      options: {
        presence: data.presence || 'default',
      },
    }),
  });
}
