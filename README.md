# ROADMAP

A program-level roadmap planning application for managing epics, features, backlog items, priorities, and Program Increments.

## Current status
This project is an active MVP roadmap planning dashboard. It includes a working frontend and backend flow backed by Prisma with SQLite, and it supports core planning workflows used in an organization-level roadmap process.

## What is built so far
- editable roadmap naming and date range
- feature creation, editing, deletion, and drag/drop ordering
- backlog creation, editing, deletion, and drag/drop ordering
- backlog-to-roadmap promotion flow
- epic creation, editing, and deletion
- Program Increment creation, editing, and deletion
- roadmap timeline display
- persisted data through Prisma models

## Tech stack
- Next.js 14
- TypeScript
- Tailwind CSS
- Prisma
- SQLite (current local database)
- dnd-kit

## Run the app
From the project folder:

```powershell
cd "C:\AI Projects\Roadmap"
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Key project files
- app/page.tsx — dashboard UI and planning interactions
- app/api/roadmap/route.ts — roadmap CRUD and ordering logic
- prisma/schema.prisma — database schema for roadmap planning entities
- requirements.md — product requirements and user needs
- tech-stack.md — technical blueprint
- design-document.md — current design and implementation summary

## Current product focus
The current implementation is focused on the foundational planning workflow for a roadmap tool:
- roadmap definition
- epic management
- feature planning
- backlog prioritization
- rank-based ordering
- PI/date management

## Resume here
Use this section to restart work without re-deriving the current project status.

### Current state snapshot
- roadmap name and date range are editable
- features can be created, reordered, edited, and deleted
- backlog items can be created, reordered, edited, deleted, and promoted into the roadmap
- epics and Program Increments are created and persisted
- Prisma + SQLite is the active persistence layer
- production build passes with npm run build

### Best files to open first
- app/page.tsx
- app/api/roadmap/route.ts
- prisma/schema.prisma
- project-memory.md
- design-document.md

### Recommended next milestone
- epic-to-feature assignment
- stronger timeline visualizations with PI bands
- Gantt bar drag/resize interactions
- team or PI filtering

### Handoff note
The app is ready to resume from the current state. The next recommended milestone is a richer timeline experience with epic-to-feature assignment and drag/resize Gantt behavior.
