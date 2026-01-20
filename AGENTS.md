<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Hype CRM - Agent Instructions

This document provides essential guidelines for AI assistants working on the Hype CRM project.

## Project Overview

Hype CRM is a Next.js-based Customer Relationship Management application built with:
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with better-sqlite3
- **Authentication**: NextAuth
- **Additional**: WhatsApp integration, Kanban board interface

## Build, Lint, and Test Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Code Quality
```bash
# Run ESLint (includes Next.js core web vitals rules)
npm run lint
```

### Testing
**Note**: This project currently has no test suite configured. When adding tests:

```bash
# Install testing framework (recommended: Jest + React Testing Library)
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Add to package.json scripts:
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"

# Run single test file
npm test -- path/to/test/file.test.tsx

# Run tests in watch mode
npm run test:watch
```

### Validation Pipeline
After making changes, run this sequence:
1. `npm run lint` - Check code quality
2. `npm run build` - Verify TypeScript compilation and build
3. `npm run dev` - Manual testing if needed

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode**: Enabled (`"strict": true`)
- **Target**: ES2017
- **Module resolution**: Bundler (supports path aliases)
- **JSX**: React JSX transform (`"jsx": "react-jsx"`)

### Path Aliases
- Use `@/` for imports from `src/` directory
- Example: `import { query } from '@/lib/db'`

### Import Organization
```typescript
// 1. React imports first
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { NextRequest, NextResponse } from 'next/server';

// 3. Local imports (use path aliases)
import { query } from '@/lib/db';
import type { Lead } from '@/types/lead';

// 4. Relative imports (avoid when possible)
import { helper } from '../utils/helper';
```

### Naming Conventions

#### Components
- **PascalCase** for component names: `KanbanBoard.tsx`
- **camelCase** for instances: `const kanbanBoard = <KanbanBoard />`

#### Files and Directories
- **PascalCase** for components: `KanbanBoard.tsx`
- **camelCase** for utilities: `database.ts`
- **kebab-case** for routes: `api/leads/route.ts`

#### Variables and Functions
- **camelCase** for variables and functions: `fetchData()`, `userName`
- **PascalCase** for types/interfaces: `interface Lead {}`
- **UPPER_CASE** for constants: `const DB_PATH = '...'`

#### Database
- **snake_case** for table/column names: `stage_id`, `created_at`
- **camelCase** for TypeScript properties: `stageId`, `createdAt`

### React Patterns

#### Client Components
Always add `'use client'` directive at the top for components using:
- useState, useEffect, or other hooks
- onClick, onChange, or other event handlers
- Browser APIs

```typescript
'use client';

import { useState } from 'react';

export default function MyComponent() {
  const [state, setState] = useState('');
  // ...
}
```

#### State Management
- Use `useState` for local component state
- Prefer controlled components with explicit state
- Use `useEffect` for side effects with proper dependency arrays

#### Data Fetching
- Use native `fetch()` for API calls
- Handle loading and error states explicitly
- Use `try/catch` for error handling

### Database Patterns

#### Connection Management
- Use the centralized database functions: `query()`, `run()`, `getOne()`
- Never create direct database connections outside of `lib/db/index.ts`
- Always use parameterized queries to prevent SQL injection

#### Schema Design
- Use `INTEGER PRIMARY KEY AUTOINCREMENT` for auto-incrementing IDs
- Include `created_at` and `updated_at` timestamps
- Use foreign keys with appropriate cascade actions
- Add CHECK constraints for data validation

#### Error Handling
- Always wrap database operations in try/catch blocks
- Log errors with `console.error()`
- Return appropriate HTTP status codes in API routes

### API Routes

#### Structure
- Use Next.js App Router: `src/app/api/[...]/route.ts`
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Use `NextRequest` and `NextResponse` from 'next/server'

#### Response Format
- Return JSON responses with `NextResponse.json()`
- Use appropriate HTTP status codes (200, 201, 400, 404, 500)
- Include error messages in response body

```typescript
export async function GET() {
  try {
    const data = await query('SELECT * FROM table');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
```

### Styling with Tailwind CSS

#### Configuration
- Uses Tailwind CSS v4 with inline theme configuration
- Custom CSS variables for theme colors
- Dark mode support via `prefers-color-scheme`

#### Class Organization
- Use utility-first approach
- Group related classes logically
- Prefer responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`

```typescript
<div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  {/* Content */}
</div>
```

### Error Handling

#### Client-Side
- Use try/catch in async functions
- Display user-friendly error messages
- Handle loading states appropriately

#### Server-Side
- Always wrap API route handlers in try/catch
- Log errors before returning error responses
- Never expose internal error details to clients

### Security Best Practices

#### Authentication
- Use NextAuth for session management
- Validate user permissions on protected routes
- Never store sensitive data in localStorage

#### Database
- Always use parameterized queries
- Validate input data before database operations
- Use transactions for multi-step operations

#### API Security
- Validate request data thoroughly
- Implement rate limiting if needed
- Use HTTPS in production

### File Organization

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── (auth)/            # Route groups
│   └── (dashboard)/       # Protected routes
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── db/               # Database layer
│   ├── auth/             # Authentication
│   └── services/         # Business logic
└── types/                # TypeScript definitions (if needed)
```

### Performance Considerations

- Use React.memo() for expensive components
- Implement proper loading states
- Optimize database queries with appropriate indexes
- Use Next.js Image component for images (when available)

### Commit Message Convention

Follow conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for formatting changes
- `refactor:` for code restructuring
- `test:` for test-related changes

Example: `feat: add lead creation functionality`

### Development Workflow

1. Create feature branch from main
2. Make changes following these guidelines
3. Run lint and build before committing
4. Write descriptive commit messages
5. Create pull request for review
6. Merge after approval

This document should be updated as the project evolves and new patterns emerge.