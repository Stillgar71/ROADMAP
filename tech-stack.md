# ROADMAP Technical Design

## Overview
This project is a multi-user program planning application built as a web app. It is designed to help organizations manage multiple roadmaps, epics, features, backlog items, item priority, and Program Increment planning.

## Recommended stack
- Frontend: Next.js 14+ with TypeScript
- Styling: Tailwind CSS
- UI state / interactions: React hooks and component-driven state
- Drag-and-drop: dnd-kit
- Database: PostgreSQL
- ORM: Prisma
- Authentication: auth provider with organization/user roles
- Validation: Zod
- Date handling: date-fns
- Hosting: Vercel or Azure App Service

## Architecture
### Frontend
- App router-based Next.js application
- Server components for read-heavy pages and data fetching
- Client components for drag/drop interactions and planning controls
- Shared design system for cards, tables, dialogs, and timeline layouts

### Backend
- Next.js API routes or service layer for backend logic
- Validation and business rules for roadmap and backlog operations
- Role- and organization-scoped access checks

### Database
- PostgreSQL for durable data storage
- Prisma schema for user, roadmap, PI, epic, feature, backlog, and link entities

## Core data model
### Organization
- id
- name

### User
- id
- name
- email
- role
- organizationId

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
- description
- rank
- startDate
- endDate
- status

### Feature
- id
- roadmapId
- epicId
- title
- description
- rank
- startDate
- endDate
- piId
- teamId
- status

### BacklogItem
- id
- organizationId
- title
- description
- type
- rank
- status
- sourceSystem
- sourceId

### ExternalLink
- id
- itemType
- itemId
- system
- externalId
- externalUrl

## Priority model
- Rank is stored as position/order metadata
- Top-to-bottom ordering defines highest-to-lowest priority
- Rank 1 is the highest priority item
- Reordering updates rank values consistently

## Gantt model
- Items render as horizontal bars on a timeline
- Start and end dates define the bar placement
- Dragging a bar horizontally changes the date range
- Resizing a bar changes start or end date
- Vertical drag reorder changes priority order

## Multi-roadmap and multi-team support
- Each roadmap belongs to one organization
- Features can be grouped by team or program area
- Users can view or edit only the roadmaps they are authorized for

## Security model
- Organization-aware access control
- Roles such as admin, planner, team lead, and viewer
- Validation on item mutations and updates

## MVP implementation plan
1. Scaffold Next.js app
2. Set up Prisma and PostgreSQL schema
3. Build auth and organization/user models
4. Create roadmap and PI management UI
5. Build epic/feature creation and editing
6. Build backlog list and rank ordering
7. Implement roadmap drag/drop and Gantt timeline
8. Add external link handling
9. Add final polish and demo seed data

## Risks / considerations
- Drag/drop ordering must remain consistent with rank data
- Bar resizing must maintain valid date ranges
- Date updates must be reflected in PI windows accurately
- Multiple users may edit the same roadmap concurrently; optimistic locking or transaction safety may be needed later

## Future enhancements
- Dependency mapping between roadmaps and features
- Capacity planning and resource allocation
- Advanced portfolio heat maps
- Reporting and export features
- Integration with external planning systems
