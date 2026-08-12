"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useState } from 'react';

type Feature = {
  id: string;
  name: string;
  rank: number;
  pi: string;
  team: string;
  start: string;
  end: string;
  status: string;
  epic: string;
};

type BacklogItem = {
  id: string;
  name: string;
  priority: number;
  status: string;
};

type Epic = {
  id: string;
  name: string;
  owner: string;
  start: string;
  end: string;
  status: string;
};

type ProgramIncrement = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

type RoadmapPayload = {
  roadmap?: {
    name?: string;
    startDate?: string;
    endDate?: string;
  };
  epics?: Array<{
    id?: string;
    title?: string;
    owner?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }>;
  features?: Array<{
    id?: string;
    title?: string;
    rank?: number;
    pi?: string;
    team?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    epic?: string;
    epicId?: string;
  }>;
  programIncrements?: Array<{
    id?: string;
    name?: string;
    startDate?: string;
    endDate?: string;
  }>;
  backlog?: Array<{
    id?: string;
    title?: string;
    priority?: number;
    status?: string;
  }>;
};

const defaultRoadmap = {
  name: 'ROADMAP',
  startDate: '2026-09-01',
  endDate: '2027-03-31',
};

function daysBetween(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
}

function calculateLeft(date: string, timelineStart: string, timelineEnd: string) {
  const start = new Date(timelineStart);
  const current = new Date(date);
  const total = daysBetween(timelineStart, timelineEnd);
  const offset = Math.round((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return (offset / total) * 100;
}

function calculateWidth(start: string, end: string, timelineStart: string, timelineEnd: string) {
  const total = daysBetween(timelineStart, timelineEnd);
  const duration = daysBetween(start, end);
  return (duration / total) * 100;
}

function SortableFeatureCard({ feature, onSelect }: { feature: Feature; onSelect: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: feature.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"
      {...attributes}
      {...listeners}
      onClick={() => onSelect(feature.id)}
    >
      <div>
        <div className="font-medium">#{feature.rank} {feature.name}</div>
        <div className="text-xs text-slate-500">{feature.team} • {feature.pi}</div>
      </div>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rank {feature.rank}</span>
    </div>
  );
}

function SortableBacklogCard({ item, onSelect }: { item: BacklogItem; onSelect: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3"
      {...attributes}
      {...listeners}
      onClick={() => onSelect(item.id)}
    >
      <span className="font-medium">{item.name}</span>
      <span className="text-sm text-slate-500">#{item.priority}</span>
    </div>
  );
}

export default function HomePage() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [programIncrements, setProgramIncrements] = useState<ProgramIncrement[]>([]);
  const [roadmapMeta, setRoadmapMeta] = useState({
    name: defaultRoadmap.name,
    startDate: defaultRoadmap.startDate,
    endDate: defaultRoadmap.endDate,
  });
  const [selectedBacklogId, setSelectedBacklogId] = useState<string | null>(null);
  const [featureForm, setFeatureForm] = useState({ title: '', team: 'Platform', pi: 'PI-03' });
  const [backlogForm, setBacklogForm] = useState({ title: '', status: 'New' });
  const [loading, setLoading] = useState(true);

  const refreshRoadmapData = async () => {
    try {
      const response = await fetch('/api/roadmap');
      if (!response.ok) throw new Error('Unable to load roadmap');

      const payload: RoadmapPayload = await response.json();

      const mappedEpics: Epic[] = (payload.epics ?? []).map((item) => ({
        id: item.id ?? `epic-${Math.random()}`,
        name: item.title ?? 'Untitled epic',
        owner: item.owner ?? 'Program',
        start: item.startDate ?? defaultRoadmap.startDate,
        end: item.endDate ?? defaultRoadmap.endDate,
        status: item.status ?? 'Planned',
      }));

      const mappedFeatures: Feature[] = (payload.features ?? []).map((item) => ({
        id: item.id ?? `feature-${Math.random()}`,
        name: item.title ?? 'Untitled feature',
        rank: item.rank ?? 0,
        pi: item.pi ?? 'PI-01',
        team: item.team ?? 'Program',
        start: item.startDate ?? defaultRoadmap.startDate,
        end: item.endDate ?? defaultRoadmap.endDate,
        status: item.status ?? 'Planned',
        epic: item.epic ?? item.epicId ?? 'Program Planning',
      }));

      const mappedBacklog: BacklogItem[] = (payload.backlog ?? []).map((item) => ({
        id: item.id ?? `backlog-${Math.random()}`,
        name: item.title ?? 'Untitled backlog item',
        priority: item.priority ?? 0,
        status: item.status ?? 'New',
      }));

      const mappedProgramIncrements: ProgramIncrement[] = (payload.programIncrements ?? []).map((item) => ({
        id: item.id ?? `pi-${Math.random()}`,
        name: item.name ?? 'PI-01',
        startDate: item.startDate ?? defaultRoadmap.startDate,
        endDate: item.endDate ?? defaultRoadmap.endDate,
      }));

      setRoadmapMeta({
        name: payload.roadmap?.name ?? defaultRoadmap.name,
        startDate: payload.roadmap?.startDate ?? defaultRoadmap.startDate,
        endDate: payload.roadmap?.endDate ?? defaultRoadmap.endDate,
      });
      setEpics(mappedEpics.length > 0 ? mappedEpics : [
        { id: 'epic-1', name: 'Platform Modernization', owner: 'Architecture', start: '2026-09-01', end: '2026-12-15', status: 'On track' },
        { id: 'epic-2', name: 'Customer Data Integration', owner: 'Data', start: '2026-10-01', end: '2027-01-30', status: 'At risk' },
        { id: 'epic-3', name: 'AI Enablement', owner: 'Product', start: '2026-11-15', end: '2027-03-10', status: 'Planned' },
      ]);
      setFeatures(mappedFeatures.length > 0 ? mappedFeatures : [
        { id: 'feature-1', name: 'Shared API Gateway', rank: 1, pi: 'PI-01', team: 'Platform', start: '2026-09-01', end: '2026-10-15', status: 'Committed', epic: 'Platform Modernization' },
        { id: 'feature-2', name: 'Data quality controls', rank: 2, pi: 'PI-01', team: 'Data', start: '2026-09-20', end: '2026-11-20', status: 'In progress', epic: 'Customer Data Integration' },
        { id: 'feature-3', name: 'Portfolio reporting', rank: 3, pi: 'PI-02', team: 'PMO', start: '2026-11-01', end: '2027-01-15', status: 'Planned', epic: 'AI Enablement' },
        { id: 'feature-4', name: 'Team onboarding flow', rank: 4, pi: 'PI-02', team: 'Delivery', start: '2026-12-01', end: '2027-02-15', status: 'Planned', epic: 'Platform Modernization' },
      ]);
      setBacklog(mappedBacklog.length > 0 ? mappedBacklog : [
        { id: 'backlog-1', name: 'Dependency tracker', priority: 1, status: 'New' },
        { id: 'backlog-2', name: 'Risk heatmap', priority: 2, status: 'New' },
        { id: 'backlog-3', name: 'Portfolio export', priority: 3, status: 'Ready' },
        { id: 'backlog-4', name: 'Cross-team alignment dashboard', priority: 4, status: 'Ready' },
      ]);
      setProgramIncrements(mappedProgramIncrements.length > 0 ? mappedProgramIncrements : [
        { id: 'pi-01', name: 'PI-01', startDate: '2026-09-01', endDate: '2026-10-30' },
        { id: 'pi-02', name: 'PI-02', startDate: '2026-11-01', endDate: '2026-12-25' },
        { id: 'pi-03', name: 'PI-03', startDate: '2027-01-05', endDate: '2027-02-26' },
      ]);
    } catch (error) {
      console.error('Failed to load roadmap data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshRoadmapData();
  }, []);

  const roadmapSummary = useMemo(
    () => [
      ['Roadmaps', '4'],
      ['Epics', String(epics.length || 12)],
      ['Features', String(features.length || 38)],
      ['Backlog', String(backlog.length || 21)],
    ],
    [backlog.length, epics.length, features.length],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleFeatureDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = features.findIndex((feature) => feature.id === String(active.id));
    const newIndex = features.findIndex((feature) => feature.id === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(features, oldIndex, newIndex).map((feature, index) => ({
      ...feature,
      rank: index + 1,
    }));

    setFeatures(reordered);

    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder-features', order: reordered.map((item) => item.id) }),
      });
    } catch (error) {
      console.error('Failed to persist feature ordering', error);
    }
  };

  const handleBacklogDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = backlog.findIndex((item) => item.id === String(active.id));
    const newIndex = backlog.findIndex((item) => item.id === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(backlog, oldIndex, newIndex).map((item, index) => ({
      ...item,
      priority: index + 1,
    }));

    setBacklog(reordered);

    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder-backlog', order: reordered.map((item) => item.id) }),
      });
    } catch (error) {
      console.error('Failed to persist backlog ordering', error);
    }
  };

  const handleFeaturePromotion = async (backlogId: string, targetFeatureId?: string) => {
    try {
      const response = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move-backlog-to-feature', backlogId, targetFeatureId }),
      });

      if (!response.ok) {
        throw new Error('Promotion failed');
      }

      setSelectedBacklogId(null);
      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to promote backlog item', error);
    }
  };

  const handleCreateFeature = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!featureForm.title.trim()) return;

    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-feature',
          title: featureForm.title.trim(),
          team: featureForm.team,
          pi: featureForm.pi,
          startDate: defaultRoadmap.startDate,
          endDate: '2027-02-15',
        }),
      });

      setFeatureForm({ title: '', team: 'Platform', pi: 'PI-03' });
      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to create feature', error);
    }
  };

  const handleCreateBacklog = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!backlogForm.title.trim()) return;

    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-backlog',
          title: backlogForm.title.trim(),
          status: backlogForm.status,
        }),
      });

      setBacklogForm({ title: '', status: 'New' });
      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to create backlog item', error);
    }
  };

  const handleCreateEpic = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem('epic-title') as HTMLInputElement | null;
    const title = input?.value?.trim();
    if (!title) return;

    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-epic',
          title,
          status: 'Planned',
          startDate: roadmapMeta.startDate,
          endDate: roadmapMeta.endDate,
        }),
      });

      if (input) input.value = '';
      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to create epic', error);
    }
  };

  const handleCreateProgramIncrement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nameInput = event.currentTarget.elements.namedItem('pi-name') as HTMLInputElement | null;
    const startInput = event.currentTarget.elements.namedItem('pi-start') as HTMLInputElement | null;
    const endInput = event.currentTarget.elements.namedItem('pi-end') as HTMLInputElement | null;
    const name = nameInput?.value?.trim();
    if (!name) return;

    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-pi',
          name,
          startDate: startInput?.value ?? roadmapMeta.startDate,
          endDate: endInput?.value ?? roadmapMeta.endDate,
        }),
      });

      if (nameInput) nameInput.value = '';
      if (startInput) startInput.value = roadmapMeta.startDate;
      if (endInput) endInput.value = roadmapMeta.endDate;
      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to create program increment', error);
    }
  };

  const handleUpdateEpic = async (id: string, updates: Partial<Epic>) => {
    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-epic',
          id,
          title: updates.name,
          status: updates.status,
          startDate: updates.start,
          endDate: updates.end,
        }),
      });

      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to update epic', error);
    }
  };

  const handleDeleteEpic = async (id: string) => {
    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-epic', id }),
      });

      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to delete epic', error);
    }
  };

  const handleUpdateProgramIncrement = async (id: string, updates: Partial<ProgramIncrement>) => {
    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-pi',
          id,
          name: updates.name,
          startDate: updates.startDate,
          endDate: updates.endDate,
        }),
      });

      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to update program increment', error);
    }
  };

  const handleDeleteProgramIncrement = async (id: string) => {
    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-pi', id }),
      });

      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to delete program increment', error);
    }
  };

  const handleUpdateRoadmap = async (updates: Partial<typeof roadmapMeta>) => {
    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-roadmap',
          name: updates.name,
          startDate: updates.startDate,
          endDate: updates.endDate,
        }),
      });

      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to update roadmap dates', error);
    }
  };

  const handleUpdateFeature = async (id: string, updates: Partial<Feature>) => {
    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-feature',
          id,
          title: updates.name,
          team: updates.team,
          pi: updates.pi,
          status: updates.status,
          startDate: updates.start,
          endDate: updates.end,
        }),
      });

      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to update feature', error);
    }
  };

  const handleDeleteFeature = async (id: string) => {
    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-feature', id }),
      });

      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to delete feature', error);
    }
  };

  const handleUpdateBacklog = async (id: string, updates: Partial<BacklogItem>) => {
    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-backlog',
          id,
          title: updates.name,
          status: updates.status,
        }),
      });

      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to update backlog item', error);
    }
  };

  const handleDeleteBacklog = async (id: string) => {
    try {
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-backlog', id }),
      });

      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to delete backlog item', error);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-800">
        <div className="rounded-2xl bg-white px-6 py-4 shadow-soft">Loading roadmap...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-soft">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Program portfolio</p>
            <input
              value={roadmapMeta.name}
              onChange={(event) => {
                const next = { ...roadmapMeta, name: event.target.value };
                setRoadmapMeta(next);
                handleUpdateRoadmap(next);
              }}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-3xl font-bold text-slate-900 focus:border-brand-500 focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              <input
                type="date"
                value={roadmapMeta.startDate}
                onChange={(event) => {
                  const next = { ...roadmapMeta, startDate: event.target.value };
                  setRoadmapMeta(next);
                  handleUpdateRoadmap(next);
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm"
              />
              <input
                type="date"
                value={roadmapMeta.endDate}
                onChange={(event) => {
                  const next = { ...roadmapMeta, endDate: event.target.value };
                  setRoadmapMeta(next);
                  handleUpdateRoadmap(next);
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">Roadmaps</button>
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">New roadmap</button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {roadmapSummary.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-3 text-3xl font-bold">{value}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Roadmap timeline</h2>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{roadmapMeta.startDate} to {roadmapMeta.endDate}</span>
            </div>

            <div className="mb-4 grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
            </div>

            <div className="space-y-4">
              {epics.map((epic) => (
                <div key={epic.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{epic.name}</h3>
                      <p className="text-sm text-slate-500">{epic.owner}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">{epic.status}</span>
                  </div>

                  <div className="relative h-6 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="absolute top-0 h-full rounded-full bg-brand-600"
                      style={{
                        left: `${calculateLeft(epic.start, roadmapMeta.startDate, roadmapMeta.endDate)}%`,
                        width: `${calculateWidth(epic.start, epic.end, roadmapMeta.startDate, roadmapMeta.endDate)}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>{epic.start}</span>
                    <span>{epic.end}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-4 text-xl font-semibold">Epics</h2>
              <form onSubmit={handleCreateEpic} className="mb-4 flex gap-2">
                <input
                  name="epic-title"
                  placeholder="Add epic"
                  className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                />
                <button type="submit" className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white">Add</button>
              </form>
              <div className="space-y-3">
                {epics.map((epic) => (
                  <div key={epic.id} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 md:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_auto]">
                    <input
                      value={epic.name}
                      onChange={(event) => handleUpdateEpic(epic.id, { ...epic, name: event.target.value })}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                    />
                    <input
                      type="date"
                      value={epic.start}
                      onChange={(event) => handleUpdateEpic(epic.id, { ...epic, start: event.target.value })}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                    />
                    <input
                      type="date"
                      value={epic.end}
                      onChange={(event) => handleUpdateEpic(epic.id, { ...epic, end: event.target.value })}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                    />
                    <select
                      value={epic.status}
                      onChange={(event) => handleUpdateEpic(epic.id, { ...epic, status: event.target.value })}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                    >
                      <option value="Planned">Planned</option>
                      <option value="On track">On track</option>
                      <option value="At risk">At risk</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleDeleteEpic(epic.id)}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-4 text-xl font-semibold">Program increments</h2>
              <form onSubmit={handleCreateProgramIncrement} className="mb-4 grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                <input name="pi-name" placeholder="PI name" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
                <input name="pi-start" type="date" defaultValue={roadmapMeta.startDate} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
                <input name="pi-end" type="date" defaultValue={roadmapMeta.endDate} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
                <button type="submit" className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white">Add</button>
              </form>
              <div className="space-y-3">
                {programIncrements.map((pi) => (
                  <div key={pi.id} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <input
                      value={pi.name}
                      onChange={(event) => handleUpdateProgramIncrement(pi.id, { ...pi, name: event.target.value })}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                    />
                    <input
                      type="date"
                      value={pi.startDate}
                      onChange={(event) => handleUpdateProgramIncrement(pi.id, { ...pi, startDate: event.target.value })}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                    />
                    <input
                      type="date"
                      value={pi.endDate}
                      onChange={(event) => handleUpdateProgramIncrement(pi.id, { ...pi, endDate: event.target.value })}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteProgramIncrement(pi.id)}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-4 text-xl font-semibold">Priority stack</h2>
              <form onSubmit={handleCreateFeature} className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex gap-2">
                  <input
                    value={featureForm.title}
                    onChange={(event) => setFeatureForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Add feature name"
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <button type="submit" className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white">Add feature</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={featureForm.team}
                    onChange={(event) => setFeatureForm((current) => ({ ...current, team: event.target.value }))}
                    placeholder="Team"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <input
                    value={featureForm.pi}
                    onChange={(event) => setFeatureForm((current) => ({ ...current, pi: event.target.value }))}
                    placeholder="PI"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </form>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFeatureDragEnd}>
                <SortableContext items={features.map((feature) => feature.id)} strategy={rectSortingStrategy}>
                  <div className="space-y-3">
                    {features.map((feature) => (
                      <div key={feature.id} className="space-y-2">
                        <SortableFeatureCard feature={feature} onSelect={() => {}} />
                        <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 md:grid-cols-[1.4fr_0.8fr_0.9fr_0.9fr_0.9fr_auto]">
                          <input
                            value={feature.name}
                            onChange={(event) => handleUpdateFeature(feature.id, { ...feature, name: event.target.value })}
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                          />
                          <input
                            value={feature.pi}
                            onChange={(event) => handleUpdateFeature(feature.id, { ...feature, pi: event.target.value })}
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                            placeholder="PI"
                          />
                          <input
                            type="date"
                            value={feature.start}
                            onChange={(event) => handleUpdateFeature(feature.id, { ...feature, start: event.target.value })}
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                          />
                          <input
                            type="date"
                            value={feature.end}
                            onChange={(event) => handleUpdateFeature(feature.id, { ...feature, end: event.target.value })}
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                          />
                          <select
                            value={feature.status}
                            onChange={(event) => handleUpdateFeature(feature.id, { ...feature, status: event.target.value })}
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                          >
                            <option value="New">New</option>
                            <option value="Planned">Planned</option>
                            <option value="Committed">Committed</option>
                            <option value="In progress">In progress</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDeleteFeature(feature.id)}
                            className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-4 text-xl font-semibold">Backlog</h2>
              <form onSubmit={handleCreateBacklog} className="mb-4 flex gap-2">
                <input
                  value={backlogForm.title}
                  onChange={(event) => setBacklogForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Add backlog item"
                  className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
                <select
                  value={backlogForm.status}
                  onChange={(event) => setBacklogForm((current) => ({ ...current, status: event.target.value }))}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="New">New</option>
                  <option value="Ready">Ready</option>
                  <option value="In progress">In progress</option>
                </select>
                <button type="submit" className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white">Add</button>
              </form>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBacklogDragEnd}>
                <SortableContext items={backlog.map((item) => item.id)} strategy={rectSortingStrategy}>
                  <div className="space-y-3">
                    {backlog.map((item) => (
                      <div key={item.id} className="space-y-2">
                        <SortableBacklogCard
                          item={item}
                          onSelect={() => setSelectedBacklogId((current) => (current === item.id ? null : item.id))}
                        />
                        <div className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                          <input
                            value={item.name}
                            onChange={(event) => handleUpdateBacklog(item.id, { ...item, name: event.target.value })}
                            className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                          />
                          <select
                            value={item.status}
                            onChange={(event) => handleUpdateBacklog(item.id, { ...item, status: event.target.value })}
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                          >
                            <option value="New">New</option>
                            <option value="Ready">Ready</option>
                            <option value="In progress">In progress</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDeleteBacklog(item.id)}
                            className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                        {selectedBacklogId === item.id && (
                          <button
                            type="button"
                            onClick={() => handleFeaturePromotion(item.id, features[0]?.id)}
                            className="w-full rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-left text-sm font-medium text-brand-700"
                          >
                            Promote to roadmap as #{features.length + 1}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
