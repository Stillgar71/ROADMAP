# Project Memory Backup

This document is a repository-local backup of the working context so the project can be resumed without relying only on the VS Code memory store.

## Project summary
- Project name: ROADMAP
- Workspace path: C:\AI Projects\Roadmap
- Stack: Next.js 14, TypeScript, Tailwind, Prisma, SQLite, dnd-kit
- Working focus: roadmap planning application for epics, features, backlog items, rankings, and PI management

## Current implemented state
- Roadmap name and date range are editable
- Feature items can be created, edited, deleted, and reordered
- Backlog items can be created, edited, deleted, and reordered
- Backlog items can be promoted into the roadmap feature list
- Epic records can be created, edited, and deleted
- Program Increment records can be created, edited, and deleted
- Timeline view renders roadmap data and supports current planning layout
- Data is persisted through Prisma and stored in SQLite locally
- Production build passes with npm run build

## Working assumptions
- This is a program planning board rather than a sprint/task tracker
- Rank 1 is the highest-priority item at the top of the stack
- Current implementation is an MVP planning workflow
- Authentication and multi-user access are not yet implemented
- Gantt drag/resize behavior is a future milestone

## Important files
- app/page.tsx — main planning dashboard and interactions
- app/api/roadmap/route.ts — persistence and API actions
- prisma/schema.prisma — data model
- README.md — app usage and overview
- requirements.md — product requirements
- tech-stack.md — technical design
- design-document.md — current implementation design summary

## Handoff note
This repo-local file should be treated as the durable backup of the session memory. If the VS Code memory store is unavailable or not visible in the workspace, this file preserves the project state and next-step context.

## Recommended next milestone
- add epic-to-feature assignment
- improve PI and timeline drawing
- add Gantt drag/resize behavior
- add user/team filters
- formalize multi-roadmap and multi-user support

## Useful commands
```powershell
cd "C:\AI Projects\Roadmap"
npm run dev
```

## Verification status
The app has been verified with a production build using:

```powershell
npm run build
```

This completed successfully.
