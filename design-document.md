# ROADMAP Design Document

## Overview
This document captures the current state of the ROADMAP project as of the handoff point. The application is a program-level roadmap planning dashboard intended to help teams manage epics, features, backlog candidates, priorities, and Program Increments within a single planning view.

## Product goal
Provide a lightweight planning workspace where a team can:
- define a roadmap and date range
- manage epics and features
- maintain a backlog that can be prioritized
- move backlog items into the roadmap
- reorder roadmap items according to rank priority
- edit planning metadata like PI values and dates
- review a roadmap timeline at a glance

## Current implemented state
The app currently includes the following working capabilities:

### Roadmap setup
- Roadmap name can be edited inline
- Roadmap start and end dates can be edited inline
- Data is persisted to SQLite through Prisma

### Features
- Create new features from the dashboard
- Edit fields such as title, PI, start date, end date, and status
- Delete features
- Reorder features with drag-and-drop
- Rank values update according to list order

### Backlog
- Create backlog items
- Edit backlog title and status
- Delete backlog items
- Reorder backlog items with drag-and-drop
- Promote backlog items into the roadmap as feature candidates

### Epics
- Create epics from the UI
- Edit epic title, status, and date range
- Delete epics

### Program Increments
- Create PI records
- Edit PI name and date range
- Delete PI records

### Timeline view
- EPIC bars render on a roadmap timeline
- Feature list remains visually tied to the portfolio planning model
- Timeline calculations use roadmap start and end dates

## Architecture summary
### Frontend
- Next.js app router
- TypeScript-based React components
- Tailwind CSS for layout and styling
- dnd-kit for list sorting interactions

### Backend
- Next.js API routes under app/api/roadmap
- Prisma-backed persistence layer
- Business logic for roadmap, feature, backlog, epic, and PI actions

### Data layer
- SQLite database in local development
- Prisma schema includes:
  - Organization
  - User
  - Roadmap
  - ProgramIncrement
  - Epic
  - Feature
  - BacklogItem
  - ExternalLink

## Data model summary
### Roadmap
- id
- organizationId
- name
- startDate
- endDate

### ProgramIncrement
- id
- roadmapId
- name
- startDate
- endDate

### Epic
- id
- roadmapId
- title
- status
- startDate
- endDate
- rank

### Feature
- id
- roadmapId
- title
- team
- pi
- status
- startDate
- endDate
- rank

### BacklogItem
- id
- organizationId
- title
- status
- priority

## Current user workflow
1. Create or load a roadmap.
2. Set the roadmap date range.
3. Add epics for the planning horizon.
4. Add PIs to define planning windows.
5. Create feature items for top-level delivery work.
6. Prioritize backlog items by drag-and-drop ordering.
7. Promote backlog items onto the roadmap.
8. Edit feature dates, PI, and status in place.
9. Review the roadmap timeline and status.

## Current assumptions and constraints
- This is a program planning board rather than a sprint/task board.
- The topmost roadmap or backlog item is the highest priority item.
- Data is local SQLite for the current prototype.
- Authentication and multi-user access are not yet implemented.
- Gantt drag/resize editing is not yet fully implemented in a rich UI form.

## Recommended next milestone
The next milestone should focus on:
- richer epic-to-feature assignment
- better PI visual bands on the timeline
- drag/resize timeline bars for features
- filtering and searching by team or PI
- stronger roadmap detail panels and edit workflows

## Verification status
The project is in a stable MVP state with a passing production build. The build was verified using:
- npm run build

## Handoff note
This document is intended to help the next session resume efficiently without re-deriving the current project structure or workflows.
