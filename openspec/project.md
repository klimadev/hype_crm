# Project Context

## Purpose
A modular CRM system with product/service management, Kanban workflow, WhatsApp automation via EvolutionAPI, single-user authentication, and SQLite3 database.

## Tech Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Database**: SQLite3 with better-sqlite3
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS 4
- **API Integration**: EvolutionAPI (localhost:8888)

## Project Conventions

### Code Style
- TypeScript strict mode enabled
- ESLint for code quality
- Functional components with TypeScript interfaces
- Feature-based folder structure under `src/features/`

### Architecture Patterns
- Feature modules for modularity and easy feature addition/removal
- Service layer pattern for business logic
- Repository pattern for database access
- API routes for backend functionality

### Testing Strategy
- Unit tests for core business logic
- Integration tests for API endpoints
- Component tests for UI interactions

### Git Workflow
- Feature branches for new changes
- Conventional commit messages
- PR-based merge to main

## Domain Context
- CRM for lead management with Kanban workflow
- WhatsApp automation for client communication
- Product/service tracking with automated triggers

## Important Constraints
- Single-user authentication only
- SQLite3 for data persistence (not production-scale)
- EvolutionAPI required for WhatsApp integration
- Local development focus

## External Dependencies
- EvolutionAPI running on localhost:8888 for WhatsApp messaging
