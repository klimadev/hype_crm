# Hype CRM - Agent Instructions

## Project Overview

Next.js 16 CRM with App Router, TypeScript (strict), Tailwind CSS v4, SQLite/better-sqlite3, and NextAuth.

## Build, Lint, and Test Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint

# Testing (no suite configured - add Jest when needed)
npm test -- path/to/test/file.test.tsx  # Run single test
npm run test:watch                      # Watch mode (add script)
```

**Validation Pipeline**: `npm run lint` → `npm run build`

## Code Style Guidelines

### TypeScript
- Strict mode enabled, target ES2017, use path aliases (`@/` for `src/`)

### Import Order
1. React imports
2. Third-party libraries
3. Local imports with `@/` alias
4. Relative imports (avoid)

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `KanbanBoard.tsx` |
| Variables/Functions | camelCase | `fetchData()`, `userName` |
| Types/Interfaces | PascalCase | `interface Lead {}` |
| Constants | UPPER_CASE | `DB_PATH` |
| DB columns | snake_case | `stage_id`, `created_at` |
| TS properties | camelCase | `stageId`, `createdAt` |

### React Patterns
- Use `'use client'` for hooks, event handlers, browser APIs
- Use `useState` for local state, controlled components
- Handle loading/error states explicitly in data fetching

### Database Patterns
- Use centralized `query()`, `run()`, `getOne()` from `@/lib/db`
- Always use parameterized queries (SQL injection prevention)
- Include `created_at` and `updated_at` timestamps
- **Prefer UNIX timestamps (integers) over ISO strings** for time-based comparisons
- **Update existing records instead of inserting duplicates** for status changes

### UNIX Timestamp Best Practice

```typescript
// ✅ CORRECT: Use UNIX timestamps for consistent comparisons
const nextReminderDate = Math.floor(nextDate.getTime() / 1000);
await run(
  `UPDATE lead_recurrence_tracker SET next_reminder_date = ? WHERE id = ?`,
  [nextReminderDate, id]
);
const reminders = await query<Reminder>(`
  SELECT * FROM lead_recurrence_tracker 
  WHERE next_reminder_date <= unixepoch()
`);

// ❌ WRONG: ISO strings cause timezone issues
const nextReminderDate = nextDate.toISOString();
```

### Record Update Pattern

```typescript
// ✅ CORRECT: Update existing record for status changes
export async function logReminderSent(
  leadId: number,
  productId: number,
  reminderId: number,
  message: string,
  nextScheduledAt: number | null
): Promise<void> {
  const existingPending = await getOne<{ id: number }>(
    `SELECT id FROM reminder_logs 
     WHERE lead_id = ? AND product_id = ? AND reminder_id = ? AND status = 'pending'
     ORDER BY id DESC LIMIT 1`,
    [leadId, productId, reminderId]
  );

  if (existingPending) {
    await run(
      `UPDATE reminder_logs SET 
        status = 'sent', 
        sent_at = unixepoch(), 
        message_preview = ?
      WHERE id = ?`,
      [message.substring(0, 100), existingPending.id]
    );
  } else {
    await run(
      `INSERT INTO reminder_logs (...) VALUES (...)`,
      [...]
    );
  }
}

// ❌ WRONG: Always inserting creates duplicate records
await run(`INSERT INTO reminder_logs (...) VALUES (...)`, [...]);
```

### Node.js Database Testing Pattern

```bash
# Test queries and verify data directly
node -e "
const Database = require('better-sqlite3');
const db = new Database('data/crm.db');

// Check table schema
const cols = db.prepare('PRAGMA table_info(product_reminders)').all();

// Verify records
const rows = db.prepare('SELECT * FROM reminder_logs').all();

// Test query logic
const result = db.prepare(\`
  SELECT * FROM lead_recurrence_tracker 
  WHERE next_reminder_date <= unixepoch()
\`).all();

console.log(JSON.stringify(result, null, 2));
"
```

### API Routes
- App Router: `src/app/api/[...]/route.ts`
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Use `NextRequest`/`NextResponse` with try/catch and proper status codes

### Styling (Tailwind CSS v4)
- Utility-first approach, group related classes
- Use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`
- Dark mode via `dark:` class

### File Organization
```
src/
├── app/              # App Router pages/routes
├── components/       # React components
├── lib/              # Utilities (db/, auth/, services/)
└── types/            # TypeScript definitions
```

## Security & Error Handling

- NextAuth for authentication, no sensitive data in localStorage
- Parameterized queries for all DB operations
- Wrap API routes in try/catch, never expose internal errors
- Validate request data on all endpoints

## Development Workflow

1. Create feature branch from main
2. Make changes following these guidelines
3. Run `npm run lint` && `npm run build`
4. Commit with conventional messages (`feat:`, `fix:`, etc.)

## Evolution API Integration

### Environment Variables

```env
EVOLUTION_API_URL=http://localhost:8080      # Evolution API server URL
EVOLUTION_API_KEY=your-api-key               # Instance or global API key
EVOLUTION_INSTANCE_NAME=default              # Instance name for sending messages
```

### API Endpoints (Evolution API 2.3+)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/instance/create` | Create new instance |
| GET | `/instance/fetchInstances` | List all instances |
| GET | `/instance/connect/{instance}` | Connect/start instance |
| GET | `/instance/connectionState/{instance}` | Get connection status |
| GET | `/instance/qrcode/{instance}` | Get QR code for pairing |
| DELETE | `/instance/logout/{instance}` | Logout without deleting |
| DELETE | `/instance/delete/{instance}` | Delete instance |
| POST | `/message/sendText/{instance}` | Send text message |

### Status States

- `created` - Instance created, waiting for connection
- `connecting` - Connecting to WhatsApp
- `connected` - Successfully connected
- `disconnected` - Connection lost
- `qrcode` - Waiting for QR scan

### Client Usage

```typescript
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';

const result = await sendWhatsAppMessage({
  instanceName: 'my-bot',      // or use EVOLUTION_INSTANCE_NAME env
  phone: '+5511999999999',
  message: 'Hello!',
  presence: 'composing',       // optional: show "typing"
});

if (result.success) {
  console.log('Message sent:', result.messageId);
} else {
  console.error('Failed:', result.error);
}
```

### Instance Management Flow

1. User creates instance → `POST /instance/create`
2. User scans QR code → `GET /instance/qrcode/{instance}`
3. Poll status until `connected` → `GET /instance/connectionState/{instance}`
4. Send messages → `POST /message/sendText/{instance}`
5. Logout (keep instance) → `DELETE /instance/logout/{instance}`
6. Delete completely → `DELETE /instance/delete/{instance}`
