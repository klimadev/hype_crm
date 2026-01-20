# Tasks: Add WhatsApp CRM Features

## Phase 1: Foundation

### 1.1 Project Setup
- [x] Update package.json with dependencies (better-sqlite3, next-auth, @types/better-sqlite3)
- [x] Create project.md in openspec with tech stack and conventions
- [x] Configure TypeScript paths for clean imports
- [x] Set up ESLint and Prettier configuration

### 1.2 Database Layer
- [x] Create lib/db/schema.ts with all table definitions
- [x] Create lib/db/index.ts with Database class and query helpers
- [x] Write migration script to create all tables
- [x] Create seed script with initial data (default stages, sample product)
- [ ] Add database connection tests

### 1.3 Authentication Setup
- [x] Install and configure NextAuth.js
- [x] Create lib/auth/config.ts with credentials provider
- [x] Create (auth)/login/page.tsx with login form
- [x] Create middleware.ts to protect dashboard routes
- [x] Add login API route (api/auth/[...nextauth])
- [ ] Test single user login flow

## Phase 2: Core Features

### 2.1 Products/Services Module
- [x] Create products API routes (CRUD)
- [x] Create (dashboard)/products/page.tsx list view
- [x] Create product form component
- [x] Add product type selection (product/service)
- [x] Implement inline editing for products
- [x] Add product deletion with confirmation

### 2.2 Kanban Board
- [x] Create KanbanBoard component
- [x] Create KanbanColumn component with drag-drop
- [x] Create KanbanCard component
- [ ] Add stage management (add, edit, reorder stages)
- [x] Implement lead movement between stages
- [ ] Add stage-product association

### 2.3 Leads Management
- [x] Create leads API routes
- [x] Add lead creation form (name, phone, email, product, stage)
- [x] Implement lead editing
- [x] Add lead deletion
- [ ] Create lead view page with history

## Phase 3: WhatsApp Integration

### 3.1 EvolutionAPI Client
- [x] Create lib/whatsapp/client.ts for API communication
- [x] Add sendWhatsAppMessage function
- [x] Create template variable resolver
- [x] Add error handling and logging
- [ ] Write unit tests for template resolution

### 3.2 WhatsApp Events System
- [x] Create whatsapp_events table
- [ ] Add WhatsApp event configuration UI
- [x] Implement stage_entry trigger logic
- [ ] Implement stage_timeout trigger logic
- [ ] Create event activation/deactivation toggle
- [ ] Add message template editor with variable placeholders

### 3.3 Event Processing
- [x] Create lib/services/whatsapp-events.ts
- [x] Implement handleStageEntry function
- [x] Implement handleStageTimeout function
- [x] Add stage entry hook in leads API
- [x] Create timeout check job (can be triggered via API for now)
- [x] Add event processing logs

### 3.4 Kanban WhatsApp Button
- [x] Add WhatsApp button to KanbanCard
- [x] Implement wa.me link generation
- [x] Style button to match design
- [ ] Add loading state for API calls
- [ ] Show success/error notifications

## Phase 4: Polish & Validation

### 4.1 UI Improvements
- [ ] Create reusable UI components (Button, Input, Card, Modal)
- [x] Add responsive design for Kanban board
- [x] Improve mobile view for products list
- [ ] Add loading states and skeletons
- [ ] Implement toast notifications

### 4.2 Testing
- [ ] Write database layer tests
- [ ] Write WhatsApp client tests
- [ ] Write template resolver tests
- [ ] Add API route tests
- [ ] Test complete user flows

### 4.3 Build & Validation
- [x] Run npm run lint and fix all issues
- [x] Run npm run build and fix any errors
- [ ] Verify all features work together
- [ ] Document architecture decisions

## Phase 5: Documentation

### 5.1 Documentation
- [ ] Create README.md with setup instructions
- [ ] Document EvolutionAPI configuration
- [x] Add inline code comments for complex logic
- [ ] Create API documentation
- [ ] Document feature module pattern for extensions
