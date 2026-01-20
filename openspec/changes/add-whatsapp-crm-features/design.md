# Design: WhatsApp CRM Integration

## Architecture Overview

```
src/
├── app/
│   ├── (auth)/           # Authentication routes
│   ├── (dashboard)/      # Protected dashboard routes
│   ├── api/              # API routes
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # Base UI components
│   ├── kanban/           # Kanban board components
│   ├── products/         # Product management components
│   └── whatsapp/         # WhatsApp-related components
├── lib/
│   ├── db/               # Database layer
│   ├── auth/             # Authentication config
│   ├── services/         # Business logic services
│   └── whatsapp/         # EvolutionAPI client
└── types/                # TypeScript type definitions
```

## Database Schema (SQLite3)

### Core Tables
```sql
-- Products/Services
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  type TEXT NOT NULL CHECK (type IN ('product', 'service')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leads
CREATE TABLE leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'new',
  stage_id INTEGER,
  product_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id) REFERENCES stages(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Kanban Stages
CREATE TABLE stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  product_id INTEGER,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- WhatsApp Events
CREATE TABLE whatsapp_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  product_id INTEGER,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('stage_entry', 'stage_timeout')),
  stage_id INTEGER,
  timeout_minutes INTEGER,
  message_template TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (stage_id) REFERENCES stages(id)
);

-- Lead Stage History (for timeout tracking)
CREATE TABLE lead_stage_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  stage_id INTEGER NOT NULL,
  entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  exited_at DATETIME,
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  FOREIGN KEY (stage_id) REFERENCES stages(id)
);
```

## WhatsApp Integration (EvolutionAPI)

### Service Layer
```typescript
// lib/whatsapp/client.ts
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8888';

interface SendMessageRequest {
  phone: string;
  message: string;
  productId?: string;
}

export async function sendWhatsAppMessage({ phone, message }: SendMessageRequest) {
  const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/default`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      phone: phone.replace(/\D/g, ''), // Remove non-digits
      text: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`EvolutionAPI error: ${response.statusText}`);
  }

  return response.json();
}
```

### Template Variable Resolution
```typescript
// lib/whatsapp/templates.ts
interface TemplateContext {
  leadName: string;
  leadPhone: string;
  productName: string;
  stageName: string;
}

export function resolveTemplate(template: string, context: TemplateContext): string {
  return template
    .replace(/{{leadName}}/g, context.leadName)
    .replace(/{{leadPhone}}/g, context.leadPhone)
    .replace(/{{productName}}/g, context.productName)
    .replace(/{{stageName}}/g, context.stageName);
}
```

## Event Trigger System

### Stage Entry Trigger
```typescript
// lib/services/whatsapp-events.ts
export async function handleStageEntry(leadId: number, stageId: number) {
  const events = await db.whatsapp_events.findMany({
    where: {
      trigger_type: 'stage_entry',
      stage_id: stageId,
      is_active: 1,
    },
  });

  for (const event of events) {
    await processWhatsAppEvent(event, leadId);
  }
}
```

### Timeout Trigger (Background Job)
```typescript
// lib/services/stage-timeout.ts
export async function checkStageTimeouts() {
  const timeoutEvents = await db.whatsapp_events.findMany({
    where: {
      trigger_type: 'stage_timeout',
      is_active: 1,
    },
  });

  for (const event of timeoutEvents) {
    const stagnantLeads = await db.lead_stage_history.find({
      where: {
        stage_id: event.stage_id,
        exited_at: null,
        entered_at: {
          lte: Date.now() - event.timeout_minutes * 60 * 1000,
        },
      },
    });

    for (const history of stagnantLeads) {
      await processWhatsAppEvent(event, history.lead_id);
    }
  }
}
```

## Authentication (NextAuth.js)

### Single User Configuration
```typescript
// lib/auth/config.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'CRM Access',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const user = await db.users.findOne({
          where: { username: credentials?.username },
        });

        if (user && user.password === credentials?.password) {
          return { id: user.id, name: user.username, email: user.username };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
};
```

## Kanban Component Structure

```
src/components/kanban/
├── KanbanBoard.tsx      # Main board container
├── KanbanColumn.tsx     # Stage column
├── KanbanCard.tsx       # Lead card with WhatsApp button
└── WhatsAppButton.tsx   # Quick action button
```

## Extensibility Pattern

### Feature Modules
Each feature follows this pattern for easy addition/removal:

```
src/features/[feature-name]/
├── components/          # React components
├── api/                 # API routes
├── services/            # Business logic
├── types/               # TypeScript types
└── index.ts             # Feature entry point
```

### Plugin Registration
```typescript
// lib/features/registry.ts
interface FeatureModule {
  name: string;
  routes?: string[];
  apiPrefix?: string;
  onMount?: () => void;
  onUnmount?: () => void;
}

const features: FeatureModule[] = [];

export function registerFeature(feature: FeatureModule) {
  features.push(feature);
}

export function getRegisteredFeatures() {
  return features;
}
```

## File Structure Summary

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── products/
│   │   │   └── page.tsx
│   │   └── kanban/
│   │       └── page.tsx
│   └── api/
│       ├── products/
│       ├── leads/
│       ├── stages/
│       └── whatsapp/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── kanban/
│   ├── products/
│   └── whatsapp/
├── lib/
│   ├── db/
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── auth/
│   ├── services/
│   └── whatsapp/
├── types/
└── middleware.ts
```
