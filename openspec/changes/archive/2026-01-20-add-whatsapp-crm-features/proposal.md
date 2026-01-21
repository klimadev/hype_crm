# Change Proposal: Add WhatsApp CRM Features

## Why
The CRM needs direct product/service management with automated WhatsApp communication capabilities. Current system lacks product tracking, Kanban workflow, and automated client notifications via EvolutionAPI. A modular architecture will ensure easy feature addition and maintenance.

## What Changes
- **ADDED**: Products/Services management with CRUD operations
- **ADDED**: WhatsApp event configuration system (stage-based and time-based triggers)
- **ADDED**: Kanban board with drag-and-drop and WhatsApp quick-action button
- **ADDED**: EvolutionAPI integration for automated WhatsApp messaging
- **ADDED**: NextAuth.js single-login authentication
- **ADDED**: SQLite3 database with modular schema design

## Impact
- Affected specs: products-services, whatsapp-events, kanban, authentication, database
- Affected code: New feature modules under src/features/, lib/db/, lib/auth/, lib/whatsapp/
- Dependencies: better-sqlite3, next-auth, EvolutionAPI on localhost:8888
