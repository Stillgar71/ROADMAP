# ROADMAP Requirements

## Product goal
Build a multi-user, multi-roadmap planning application for program-level portfolio management. The system helps teams prioritize epics and features, assign delivery dates, manage program increments, and maintain a backlog that can be planned into a roadmap.

## Core user needs
- Create and manage multiple roadmaps within an organization
- Support multiple users with role-based access
- Define and manage epics and features
- Maintain a backlog of items not yet scheduled
- Rank items top-to-bottom with the highest priority at rank 1
- Drag backlog items into a roadmap and track assignment status
- View a date-based Gantt chart for roadmap items
- Resize and drag Gantt bars to adjust start/end dates
- Configure custom Program Increment (PI) periods
- Link roadmap items to external development work items in other tools
- Support multiple teams working under a program

## Key workflows
1. Create organization and roadmap
2. Add epics and features
3. Create backlog items
4. Rank backlog items by priority
5. Drag backlog items into a roadmap
6. Assign dates and PI values
7. Adjust Gantt bars by drag/resize
8. Reorder roadmap items vertically to set priority
9. Link related work in other systems
10. Review program-level status across multiple teams

## Functional requirements
### Multi-user and multi-roadmap
- Each organization has multiple users and multiple roadmaps
- Users can have access roles such as admin, planner, viewer, or team lead
- Roadmaps are organization-scoped

### Planning hierarchy
- Epic: high-level program initiative
- Feature: roadmap item assigned to a roadmap and team
- Backlog item: unscheduled candidate for roadmap planning
- External linked item: reference to work tracked elsewhere

### Ranking
- Each roadmap or backlog list supports a top-to-bottom priority order
- The top item is rank 1
- Reordering updates rank values automatically
- Drag/drop is used for both top-to-bottom ranking and backlog-to-roadmap movement

### Gantt / planning
- Roadmap items display as bars on a timeline
- Users can drag bars horizontally to change dates
- Users can resize bar start/end boundaries
- Date changes update the associated PI or roadmap view automatically where relevant
- Items can be filtered by date range or PI

### Program increments
- PIs are configurable and user-defined
- Each item can belong to one or more logical planning windows, depending on design
- PI configuration should support custom start/end dates

### External integration
- Support external references to tools such as Jira, Azure DevOps, or GitHub
- Store external system and work item identifier
- Provide links back to the source work item

## Non-functional requirements
- Web application with responsive layouts
- Secure multi-user access
- Reliable data persistence
- Fast UI interactions for drag/drop and planning edits
- Reasonable scalability for multi-team planning data
- Clear error handling and validation

## Recommended initial stack
- Frontend: Next.js + TypeScript
- Styling: Tailwind CSS
- Database: PostgreSQL
- ORM: Prisma
- Drag and drop: dnd-kit
- Auth: secure provider-based auth solution
- Deployment: Vercel or Azure-hosted app

## MVP scope
The first implementation should include:
- multi-user login and organization structure
- multiple roadmap support
- epic and feature entry
- backlog management
- drag/drop ranking
- Gantt timeline for planned items
- date/PI adjustment via bar resize and drag
- external-link support for downstream work items

## Out of scope for MVP
- advanced dependency network analysis
- resource capacity planning
- complicated portfolio scoring
- advanced cross-organization workflow automation

## Success criteria
- A user can create multiple roadmaps, add epics/features, and sort priorities
- A user can drag backlog items onto the roadmap
- A user can adjust roadmap item dates by dragging or resizing the Gantt bar
- A user can see program-level planning across multiple teams
- A user can link external work items for traceability
