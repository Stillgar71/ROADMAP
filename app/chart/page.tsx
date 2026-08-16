"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Epic = {
  id: string;
  name: string;
  owner: string;
  start: string;
  end: string;
  status: string;
};

type Feature = {
  id: string;
  name: string;
  epicId: string;
  start: string;
  end: string;
  status: string;
  pi: string;
};

type ProgramIncrement = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

type Milestone = {
  id: string;
  name: string;
  date: string;
  status: string;
  type: 'Release' | 'Feature';
  featureId: string;
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
    epicId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    pi?: string;
  }>;
  programIncrements?: Array<{
    id?: string;
    name?: string;
    startDate?: string;
    endDate?: string;
  }>;
  milestones?: Array<{
    id?: string;
    name?: string;
    date?: string;
    status?: string;
    type?: string;
    featureId?: string;
    feature?: { id?: string; title?: string };
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
  return Math.max(0, Math.min(100, (offset / total) * 100));
}

function calculateWidth(start: string, end: string, timelineStart: string, timelineEnd: string) {
  const total = daysBetween(timelineStart, timelineEnd);
  const duration = daysBetween(start, end);
  return Math.max(0, Math.min(100 - calculateLeft(start, timelineStart, timelineEnd), (duration / total) * 100));
}

function monthRange(start: string, end: string) {
  const months: Array<{ key: string; label: string; start: string; end: string }> = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  cursor.setUTCDate(1);
  const last = new Date(`${end}T00:00:00Z`);
  last.setUTCDate(1);

  while (cursor <= last) {
    const monthStart = new Date(cursor);
    const monthEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0));
    months.push({
      key: `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}`,
      label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
      start: monthStart.toISOString().slice(0, 10),
      end: monthEnd.toISOString().slice(0, 10),
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

function milestoneColor(status: string) {
  if (status === 'Green') return { markerBackground: '#34d399', markerBorder: '#047857', line: '#34d399' };
  if (status === 'Red') return { markerBackground: '#f87171', markerBorder: '#b91c1c', line: '#f87171' };
  return { markerBackground: '#facc15', markerBorder: '#a16207', line: '#facc15' };
}

function featureBarColor(status: string) {
  if (status === 'Committed') return '#2563eb';
  if (status === 'In progress') return '#22c55e';
  if (status === 'Blocked') return '#ef4444';
  return '#64748b';
}

export default function ChartPage() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [programIncrements, setProgramIncrements] = useState<ProgramIncrement[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneForm, setMilestoneForm] = useState({ name: '', date: '', status: 'Green', type: 'Release' as 'Release' | 'Feature', featureId: '' });
  const [roadmapMeta, setRoadmapMeta] = useState({
    name: defaultRoadmap.name,
    startDate: defaultRoadmap.startDate,
    endDate: defaultRoadmap.endDate,
  });
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
        status: item.status ?? 'Green',
      }));

      const mappedFeatures: Feature[] = (payload.features ?? []).map((item) => ({
        id: item.id ?? `feature-${Math.random()}`,
        name: item.title ?? 'Untitled feature',
        epicId: item.epicId ?? '',
        start: item.startDate ?? payload.roadmap?.startDate ?? defaultRoadmap.startDate,
        end: item.endDate ?? payload.roadmap?.endDate ?? defaultRoadmap.endDate,
        status: item.status ?? 'Planned',
        pi: item.pi ?? '',
      })).filter((feature) => ['Planned', 'Committed', 'In progress', 'Blocked'].includes(feature.status));

      const mappedProgramIncrements: ProgramIncrement[] = (payload.programIncrements ?? []).map((item) => ({
        id: item.id ?? `pi-${Math.random()}`,
        name: item.name ?? 'PI-01',
        startDate: item.startDate ?? defaultRoadmap.startDate,
        endDate: item.endDate ?? defaultRoadmap.endDate,
      }));

      const mappedMilestones: Milestone[] = (payload.milestones ?? []).map((item) => ({
        id: item.id ?? `milestone-${Math.random()}`,
        name: item.name ?? 'Untitled milestone',
        date: item.date ?? payload.roadmap?.startDate ?? defaultRoadmap.startDate,
        status: item.status ?? 'Planned',
        type: item.type === 'Feature' ? 'Feature' : 'Release',
        featureId: item.featureId ?? item.feature?.id ?? '',
      }));

      setRoadmapMeta({
        name: payload.roadmap?.name ?? defaultRoadmap.name,
        startDate: payload.roadmap?.startDate ?? defaultRoadmap.startDate,
        endDate: payload.roadmap?.endDate ?? defaultRoadmap.endDate,
      });
      setEpics(mappedEpics);
      setFeatures(mappedFeatures);
      setProgramIncrements(mappedProgramIncrements);
      setMilestones(mappedMilestones);
    } catch (error) {
      console.error('Failed to load roadmap data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshRoadmapData();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-800">
        <div className="rounded-2xl bg-white px-6 py-4 shadow-soft">Loading roadmap chart...</div>
      </main>
    );
  }

  const months = monthRange(roadmapMeta.startDate, roadmapMeta.endDate);
  const timelineStart = roadmapMeta.startDate;
  const timelineEnd = roadmapMeta.endDate;
  const featuresByEpic = (epicId: string) => features.filter((feature) => feature.epicId === epicId);
  const releaseMilestones = milestones.filter((milestone) => milestone.type === 'Release');

  const createMilestone = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!milestoneForm.name.trim() || !milestoneForm.date) return;

    const response = await fetch('/api/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create-milestone', ...milestoneForm, name: milestoneForm.name.trim() }),
    });
    if (response.ok) {
      setMilestoneForm({ name: '', date: '', status: 'Green', type: 'Release', featureId: '' });
      await refreshRoadmapData();
    }
  };

  const updateMilestone = async (id: string, updates: Partial<Milestone>) => {
    setMilestones((current) => current.map((milestone) => milestone.id === id ? { ...milestone, ...updates } : milestone));
    try {
      const response = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-milestone', id, ...updates }),
      });
      if (!response.ok) throw new Error('Milestone update failed');
      await refreshRoadmapData();
    } catch (error) {
      console.error('Failed to update milestone', error);
      await refreshRoadmapData();
    }
  };

  const saveMilestone = async (milestone: Milestone) => {
    await updateMilestone(milestone.id, {
      name: milestone.name,
      date: milestone.date,
      status: milestone.status,
      type: milestone.type,
      featureId: milestone.featureId,
    });
  };

  const editMilestoneLocally = (id: string, updates: Partial<Milestone>) => {
    setMilestones((current) => current.map((milestone) => milestone.id === id ? { ...milestone, ...updates } : milestone));
  };

  const deleteMilestone = async (id: string) => {
    await fetch('/api/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete-milestone', id }),
    });
    setMilestones((current) => current.filter((milestone) => milestone.id !== id));
  };

  return (
    <main className="min-h-screen w-full bg-slate-100 p-[1in] text-slate-900">
      <div className="mx-auto w-full max-w-none space-y-6">
        <header className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-soft">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Roadmap visualization</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{roadmapMeta.name}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {roadmapMeta.startDate} to {roadmapMeta.endDate}
            </p>
          </div>
          <Link href="/" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            ← Back to dashboard
          </Link>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Timeline</h2>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {roadmapMeta.startDate} to {roadmapMeta.endDate}
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="mb-2 grid grid-cols-[180px_1fr]">
                <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Work item</div>
                <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
                  {months.map((month) => <div key={month.key} className="border-l border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-500">{month.label}</div>)}
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50/50">
                <div className="grid grid-cols-[180px_1fr]">
                  <div className="px-3 py-3 text-sm font-semibold text-brand-800">Program increments</div>
                  <div className="relative h-12 bg-white">
                    {months.map((month) => <div key={month.key} className="absolute inset-y-0 border-l border-slate-200" style={{ left: `${calculateLeft(month.start, timelineStart, timelineEnd)}%` }} />)}
                    {programIncrements.map((pi) => (
                      <div key={pi.id} className="absolute top-2 h-8 rounded border border-brand-600 bg-brand-500 px-2 py-1 text-xs font-semibold text-white" style={{ left: `${calculateLeft(pi.startDate, timelineStart, timelineEnd)}%`, width: `${calculateWidth(pi.startDate, pi.endDate, timelineStart, timelineEnd)}%` }} title={`${pi.name}: ${pi.startDate} to ${pi.endDate}`}>
                        <span className="block truncate">{pi.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/50">
                <div className="grid grid-cols-[180px_1fr]">
                  <div className="px-3 py-3 text-sm font-semibold text-amber-800">Milestones</div>
                  <div className="relative h-12 bg-white">
                    {months.map((month) => <div key={month.key} className="absolute inset-y-0 border-l border-slate-100" style={{ left: `${calculateLeft(month.start, timelineStart, timelineEnd)}%` }} />)}
                    {releaseMilestones.map((milestone) => (
                      <div key={milestone.id} className="absolute top-1 h-10 -translate-x-1/2" style={{ left: `${calculateLeft(milestone.date, timelineStart, timelineEnd)}%` }} title={`${milestone.name}: ${milestone.date}`}>
                        <div className="mx-auto h-4 w-4 rotate-45 rounded-sm border-2" style={{ backgroundColor: milestoneColor(milestone.status).markerBackground, borderColor: milestoneColor(milestone.status).markerBorder }} />
                        <span className="mt-1 block max-w-28 -translate-x-1/2 truncate text-center text-[10px] font-semibold text-amber-800">{milestone.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {epics.map((epic) => (
                  <div key={epic.id} className="rounded-lg border border-slate-200 bg-slate-50">
                    <div className="grid grid-cols-[180px_1fr] items-center border-b border-slate-200">
                      <div className="px-3 py-3"><div className="font-semibold">{epic.name}</div><div className="text-xs text-slate-500">{epic.owner} · {epic.status}</div></div>
                      <div className="relative h-12 bg-white">
                        {months.map((month) => <div key={month.key} className="absolute inset-y-0 border-l border-slate-100" style={{ left: `${calculateLeft(month.start, timelineStart, timelineEnd)}%` }} />)}
                        {releaseMilestones.map((milestone) => <div key={milestone.id} className="absolute inset-y-0 border-l-2 border-dashed" style={{ left: `${calculateLeft(milestone.date, timelineStart, timelineEnd)}%`, borderColor: milestoneColor(milestone.status).line }} />)}
                        <div className="absolute top-2 h-8 rounded bg-slate-700 px-2 py-1 text-xs font-semibold text-white" style={{ left: `${calculateLeft(epic.start, timelineStart, timelineEnd)}%`, width: `${calculateWidth(epic.start, epic.end, timelineStart, timelineEnd)}%` }} title={`${epic.start} to ${epic.end}`}><span className="block truncate">{epic.name}</span></div>
                      </div>
                    </div>
                    {featuresByEpic(epic.id).map((feature) => (
                      <div key={feature.id} className="grid grid-cols-[180px_1fr] items-center border-b border-slate-100 last:border-b-0">
                        <div className="px-3 py-2 pl-6 text-sm text-slate-700"><span className="mr-1 text-slate-400">↳</span>{feature.name}</div>
                        <div className="relative h-9 bg-white">
                          {months.map((month) => <div key={month.key} className="absolute inset-y-0 border-l border-slate-100" style={{ left: `${calculateLeft(month.start, timelineStart, timelineEnd)}%` }} />)}
                          {releaseMilestones.map((milestone) => <div key={milestone.id} className="absolute inset-y-0 border-l-2 border-dashed" style={{ left: `${calculateLeft(milestone.date, timelineStart, timelineEnd)}%`, borderColor: milestoneColor(milestone.status).line }} title={milestone.name} />)}
                          <div className="absolute top-1.5 h-6 rounded px-2 py-1 text-[11px] font-medium text-white" style={{ left: `${calculateLeft(feature.start, timelineStart, timelineEnd)}%`, width: `${calculateWidth(feature.start, feature.end, timelineStart, timelineEnd)}%`, backgroundColor: featureBarColor(feature.status) }} title={`${feature.name}: ${feature.start} to ${feature.end}`}><span className="block truncate">{feature.pi ? `${feature.pi} · ${feature.status}` : feature.status}</span></div>
                          {milestones.filter((milestone) => milestone.type === 'Feature' && milestone.featureId === feature.id).map((milestone) => <div key={milestone.id} className="absolute top-0.5 z-10 h-4 w-4 -translate-x-1/2 rotate-45 rounded-sm border-2" style={{ left: `${calculateLeft(milestone.date, timelineStart, timelineEnd)}%`, backgroundColor: milestoneColor(milestone.status).markerBackground, borderColor: milestoneColor(milestone.status).markerBorder }} title={`${milestone.name}: ${milestone.date}`} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Milestones</h2>
            <span className="text-sm text-slate-500">Roadmap checkpoints</span>
          </div>
          <form onSubmit={createMilestone} className="mb-5 grid gap-2 md:grid-cols-[1fr_160px_150px_1fr_160px_auto]">
            <input value={milestoneForm.name} onChange={(event) => setMilestoneForm((current) => ({ ...current, name: event.target.value }))} placeholder="Milestone name" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
            <input type="date" value={milestoneForm.date} onChange={(event) => setMilestoneForm((current) => ({ ...current, date: event.target.value }))} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
            <select value={milestoneForm.type} onChange={(event) => setMilestoneForm((current) => ({ ...current, type: event.target.value as 'Release' | 'Feature', featureId: '' }))} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
              <option value="Release">Release marker</option>
              <option value="Feature">Feature marker</option>
            </select>
            {milestoneForm.type === 'Feature' ? <select value={milestoneForm.featureId} onChange={(event) => setMilestoneForm((current) => ({ ...current, featureId: event.target.value }))} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"><option value="">Select feature</option>{features.map((feature) => <option key={feature.id} value={feature.id}>{feature.name}</option>)}</select> : <div />}
            <select value={milestoneForm.status} onChange={(event) => setMilestoneForm((current) => ({ ...current, status: event.target.value }))} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
              <option value="Green">Green</option>
              <option value="Yellow">Yellow</option>
              <option value="Red">Red</option>
            </select>
            <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Add milestone</button>
          </form>
          <div className="space-y-2">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 md:grid-cols-[1fr_160px_150px_1fr_160px_auto_auto]">
                <input value={milestone.name} onChange={(event) => editMilestoneLocally(milestone.id, { name: event.target.value })} className="rounded border border-slate-300 bg-white px-2 py-1 text-sm" />
                <input type="date" value={milestone.date} onChange={(event) => editMilestoneLocally(milestone.id, { date: event.target.value })} className="rounded border border-slate-300 bg-white px-2 py-1 text-sm" />
                <select value={milestone.type} onChange={(event) => { const type = event.target.value as 'Release' | 'Feature'; editMilestoneLocally(milestone.id, { type, featureId: type === 'Feature' ? milestone.featureId || features[0]?.id || '' : '' }); }} className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"><option value="Release">Release</option><option value="Feature">Feature</option></select>
                <select value={milestone.featureId} disabled={milestone.type !== 'Feature'} onChange={(event) => editMilestoneLocally(milestone.id, { featureId: event.target.value })} className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"><option value="">{milestone.type === 'Feature' ? 'Select feature' : 'All roadmap items'}</option>{features.map((feature) => <option key={feature.id} value={feature.id}>{feature.name}</option>)}</select>
                <select value={milestone.status} onChange={(event) => editMilestoneLocally(milestone.id, { status: event.target.value })} className="rounded border border-slate-300 bg-white px-2 py-1 text-sm">
                  <option value="Green">Green</option>
                  <option value="Yellow">Yellow</option>
                  <option value="Red">Red</option>
                </select>
                <button type="button" onClick={() => saveMilestone(milestone)} className="rounded bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700">Update milestone</button>
                <button type="button" onClick={() => deleteMilestone(milestone.id)} className="rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">Delete</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
