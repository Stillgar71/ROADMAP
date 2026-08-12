export const mockRoadmapData = {
  roadmap: {
    id: 'roadmap-demo',
    name: 'Q4 2026 Program Roadmap',
    startDate: '2026-09-01',
    endDate: '2027-03-31',
  },
  epics: [
    { name: 'Platform Modernization', owner: 'Architecture', start: '2026-09-01', end: '2026-12-15', status: 'On track' },
    { name: 'Customer Data Integration', owner: 'Data', start: '2026-10-01', end: '2027-01-30', status: 'At risk' },
    { name: 'AI Enablement', owner: 'Product', start: '2026-11-15', end: '2027-03-10', status: 'Planned' },
  ],
  features: [
    { id: 'feature-1', name: 'Shared API Gateway', rank: 1, pi: 'PI-01', team: 'Platform', start: '2026-09-01', end: '2026-10-15', status: 'Committed', epic: 'Platform Modernization' },
    { id: 'feature-2', name: 'Data quality controls', rank: 2, pi: 'PI-01', team: 'Data', start: '2026-09-20', end: '2026-11-20', status: 'In progress', epic: 'Customer Data Integration' },
    { id: 'feature-3', name: 'Portfolio reporting', rank: 3, pi: 'PI-02', team: 'PMO', start: '2026-11-01', end: '2027-01-15', status: 'Planned', epic: 'AI Enablement' },
    { id: 'feature-4', name: 'Team onboarding flow', rank: 4, pi: 'PI-02', team: 'Delivery', start: '2026-12-01', end: '2027-02-15', status: 'Planned', epic: 'Platform Modernization' },
  ],
  backlog: [
    { id: 'backlog-1', name: 'Dependency tracker', priority: 1, status: 'New' },
    { id: 'backlog-2', name: 'Risk heatmap', priority: 2, status: 'New' },
    { id: 'backlog-3', name: 'Portfolio export', priority: 3, status: 'Ready' },
    { id: 'backlog-4', name: 'Cross-team alignment dashboard', priority: 4, status: 'Ready' },
  ],
};
