"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RichTextEditor } from "../components/rich-text-editor";
import { Toasts, type ToastMessage } from "../components/toast";

type Epic = {
  id: string;
  name: string;
  owner: string;
  description: string;
  acceptanceCriteria: string;
  notes: string;
  start: string;
  end: string;
  status: string;
};

type Feature = {
  id: string;
  name: string;
  epicId: string;
  team: string;
  description: string;
  acceptanceCriteria: string;
  notes: string;
  start: string;
  end: string;
  status: string;
  pi: string;
  tasks: Task[];
};

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
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
  type: "Release" | "Feature";
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
    description?: string | null;
    acceptanceCriteria?: string | null;
    notes?: string | null;
    startDate?: string;
    endDate?: string;
    status?: string;
  }>;
  features?: Array<{
    id?: string;
    title?: string;
    epicId?: string;
    team?: string;
    description?: string | null;
    acceptanceCriteria?: string | null;
    notes?: string | null;
    startDate?: string;
    endDate?: string;
    status?: string;
    pi?: string;
    tasks?: Array<{
      id?: string;
      title?: string;
      description?: string | null;
      status?: string;
      startDate?: string;
      endDate?: string;
    }>;
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
  name: "ROADMAP",
  startDate: "2026-09-01",
  endDate: "2027-03-31",
};

function daysBetween(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.max(
    1,
    Math.round(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
}

function calculateLeft(
  date: string,
  timelineStart: string,
  timelineEnd: string,
) {
  const start = new Date(timelineStart);
  const current = new Date(date);
  const total = daysBetween(timelineStart, timelineEnd);
  const offset = Math.round(
    (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(0, Math.min(100, (offset / total) * 100));
}

function calculateWidth(
  start: string,
  end: string,
  timelineStart: string,
  timelineEnd: string,
) {
  const total = daysBetween(timelineStart, timelineEnd);
  const duration = daysBetween(start, end);
  return Math.max(
    0,
    Math.min(
      100 - calculateLeft(start, timelineStart, timelineEnd),
      (duration / total) * 100,
    ),
  );
}

function monthRange(start: string, end: string) {
  const months: Array<{
    key: string;
    label: string;
    start: string;
    end: string;
  }> = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  cursor.setUTCDate(1);
  const last = new Date(`${end}T00:00:00Z`);
  last.setUTCDate(1);

  while (cursor <= last) {
    const monthStart = new Date(cursor);
    const monthEnd = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0),
    );
    months.push({
      key: `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}`,
      label: monthStart.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
      start: monthStart.toISOString().slice(0, 10),
      end: monthEnd.toISOString().slice(0, 10),
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

function milestoneColor(status: string) {
  if (status === "Green")
    return {
      markerBackground: "#34d399",
      markerBorder: "#047857",
      line: "#34d399",
    };
  if (status === "Red")
    return {
      markerBackground: "#f87171",
      markerBorder: "#b91c1c",
      line: "#f87171",
    };
  return {
    markerBackground: "#facc15",
    markerBorder: "#a16207",
    line: "#facc15",
  };
}

function featureBarColor(status: string) {
  if (status === "Committed") return "#2563eb";
  if (status === "In progress") return "#0f766e";
  if (status === "Blocked") return "#b91c1c";
  if (status === "Completed") return "#15803d";
  return "#64748b";
}

function epicBarColor(status: string) {
  if (status === "On track") return "#15803d";
  if (status === "At risk") return "#b45309";
  if (status === "Completed") return "#1d4ed8";
  return "#64748b";
}

export default function ChartPage() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [programIncrements, setProgramIncrements] = useState<
    ProgramIncrement[]
  >([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneForm, setMilestoneForm] = useState({
    name: "",
    date: "",
    status: "Green",
    type: "Release" as "Release" | "Feature",
    featureId: "",
  });
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(
    new Set(),
  );
  const [taskForms, setTaskForms] = useState<Record<string, Omit<Task, "id">>>(
    {},
  );
  const [featureMenu, setFeatureMenu] = useState<{
    feature: Feature;
    x: number;
    y: number;
  } | null>(null);
  const [detailsFeature, setDetailsFeature] = useState<Feature | null>(null);
  const [taskFeature, setTaskFeature] = useState<Feature | null>(null);
  const [epicMenu, setEpicMenu] = useState<{
    epic: Epic;
    x: number;
    y: number;
  } | null>(null);
  const [taskMenu, setTaskMenu] = useState<{
    task: Task;
    feature: Feature;
    x: number;
    y: number;
  } | null>(null);
  const [detailsEpic, setDetailsEpic] = useState<Epic | null>(null);
  const [detailsTask, setDetailsTask] = useState<{
    task: Task;
    feature: Feature;
  } | null>(null);
  const [workItemWidth, setWorkItemWidth] = useState(180);
  const [roadmapMeta, setRoadmapMeta] = useState({
    name: defaultRoadmap.name,
    startDate: defaultRoadmap.startDate,
    endDate: defaultRoadmap.endDate,
  });
  const [loading, setLoading] = useState(true);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);

  const notify = (text: string, type: ToastMessage["type"] = "success") => {
    setToastMessages((current) => [...current, { id: Date.now() + Math.random(), text, type }]);
  };

  const refreshRoadmapData = async () => {
    try {
      const response = await fetch("/api/roadmap");
      if (!response.ok) throw new Error("Unable to load roadmap");

      const payload: RoadmapPayload = await response.json();

      const mappedEpics: Epic[] = (payload.epics ?? []).map((item) => ({
        id: item.id ?? `epic-${Math.random()}`,
        name: item.title ?? "Untitled epic",
        owner: item.owner ?? "Program",
        description: item.description ?? "",
        acceptanceCriteria: item.acceptanceCriteria ?? "",
        notes: item.notes ?? "",
        start: item.startDate ?? defaultRoadmap.startDate,
        end: item.endDate ?? defaultRoadmap.endDate,
        status: item.status ?? "Green",
      }));

      const mappedFeatures: Feature[] = (payload.features ?? [])
        .map((item) => ({
          id: item.id ?? `feature-${Math.random()}`,
          name: item.title ?? "Untitled feature",
          epicId: item.epicId ?? "",
          team: item.team ?? "Program",
          description: item.description ?? "",
          acceptanceCriteria: item.acceptanceCriteria ?? "",
          notes: item.notes ?? "",
          start:
            item.startDate ??
            payload.roadmap?.startDate ??
            defaultRoadmap.startDate,
          end:
            item.endDate ?? payload.roadmap?.endDate ?? defaultRoadmap.endDate,
          status: item.status ?? "Planned",
          pi: item.pi ?? "",
          tasks: (item.tasks ?? []).map((task) => ({
            id: task.id ?? `task-${Math.random()}`,
            title: task.title ?? "Untitled task",
            description: task.description ?? "",
            status: task.status ?? "Planned",
            startDate:
              task.startDate ?? item.startDate ?? defaultRoadmap.startDate,
            endDate: task.endDate ?? item.endDate ?? defaultRoadmap.endDate,
          })),
        }))
        .filter((feature) =>
          [
            "Planned",
            "Committed",
            "In progress",
            "Blocked",
            "Completed",
          ].includes(feature.status),
        );

      const mappedProgramIncrements: ProgramIncrement[] = (
        payload.programIncrements ?? []
      ).map((item) => ({
        id: item.id ?? `pi-${Math.random()}`,
        name: item.name ?? "PI-01",
        startDate: item.startDate ?? defaultRoadmap.startDate,
        endDate: item.endDate ?? defaultRoadmap.endDate,
      }));

      const mappedMilestones: Milestone[] = (payload.milestones ?? []).map(
        (item) => ({
          id: item.id ?? `milestone-${Math.random()}`,
          name: item.name ?? "Untitled milestone",
          date:
            item.date ?? payload.roadmap?.startDate ?? defaultRoadmap.startDate,
          status: item.status ?? "Planned",
          type: item.type === "Feature" ? "Feature" : "Release",
          featureId: item.featureId ?? item.feature?.id ?? "",
        }),
      );

      setRoadmapMeta({
        name: payload.roadmap?.name ?? defaultRoadmap.name,
        startDate: payload.roadmap?.startDate ?? defaultRoadmap.startDate,
        endDate: payload.roadmap?.endDate ?? defaultRoadmap.endDate,
      });
      setEpics(mappedEpics);
      setFeatures(mappedFeatures);
      setExpandedEpics((current) =>
        current.size > 0
          ? current
          : new Set(mappedEpics.map((epic) => epic.id)),
      );
      setExpandedFeatures((current) =>
        current.size > 0
          ? current
          : new Set(mappedFeatures.map((feature) => feature.id)),
      );
      setProgramIncrements(mappedProgramIncrements);
      setMilestones(mappedMilestones);
    } catch (error) {
      console.error("Failed to load roadmap data", error);
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
        <div className="rounded-2xl bg-white px-6 py-4 shadow-soft">
          Loading roadmap chart...
        </div>
      </main>
    );
  }

  const months = monthRange(roadmapMeta.startDate, roadmapMeta.endDate);
  const timelineStart = roadmapMeta.startDate;
  const timelineEnd = roadmapMeta.endDate;
  const timelineGridStyle = {
    gridTemplateColumns: `${workItemWidth}px minmax(0, 1fr)`,
  };
  const featuresByEpic = (epicId: string) =>
    features.filter((feature) => feature.epicId === epicId);
  const releaseMilestones = milestones.filter(
    (milestone) => milestone.type === "Release",
  );

  const createMilestone = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!milestoneForm.name.trim() || !milestoneForm.date) return;

    const response = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-milestone",
        ...milestoneForm,
        name: milestoneForm.name.trim(),
      }),
    });
    if (response.ok) {
      setMilestoneForm({
        name: "",
        date: "",
        status: "Green",
        type: "Release",
        featureId: "",
      });
      await refreshRoadmapData();
      notify("Milestone added.");
    } else {
      notify("Milestone could not be added.", "error");
    }
  };

  const updateMilestone = async (id: string, updates: Partial<Milestone>) => {
    setMilestones((current) =>
      current.map((milestone) =>
        milestone.id === id ? { ...milestone, ...updates } : milestone,
      ),
    );
    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-milestone", id, ...updates }),
      });
      if (!response.ok) throw new Error("Milestone update failed");
      await refreshRoadmapData();
    } catch (error) {
      console.error("Failed to update milestone", error);
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
    notify("Milestone saved.");
  };

  const editMilestoneLocally = (id: string, updates: Partial<Milestone>) => {
    setMilestones((current) =>
      current.map((milestone) =>
        milestone.id === id ? { ...milestone, ...updates } : milestone,
      ),
    );
  };

  const deleteMilestone = async (id: string) => {
    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-milestone", id }),
      });
      if (!response.ok) throw new Error("Milestone deletion failed");
      setMilestones((current) => current.filter((milestone) => milestone.id !== id));
      notify("Milestone deleted.");
    } catch (error) {
      console.error("Failed to delete milestone", error);
      notify("Milestone could not be deleted.", "error");
    }
  };

  const toggleExpanded = (
    setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string,
  ) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const taskFormFor = (feature: Feature) =>
    taskForms[feature.id] ?? {
      title: "",
      description: "",
      status: "Planned",
      startDate: feature.start,
      endDate: feature.end,
    };

  const createTask = async (
    feature: Feature,
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const form = taskFormFor(feature);
    if (!form.title.trim() || !form.startDate || !form.endDate) return;
    const response = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-task",
        featureId: feature.id,
        ...form,
        title: form.title.trim(),
      }),
    });
    if (response.ok) {
      setTaskForms((current) => ({
        ...current,
        [feature.id]: {
          title: "",
          description: "",
          status: "Planned",
          startDate: feature.start,
          endDate: feature.end,
        },
      }));
      setTaskFeature(null);
      await refreshRoadmapData();
      notify("Task added.");
    } else {
      notify("Task could not be added.", "error");
    }
  };

  const updateEpicStatus = async (epic: Epic, status: string) => {
    setDetailsEpic({ ...epic, status });
  };

  const updateFeatureStatus = async (feature: Feature, status: string) => {
    setDetailsFeature({ ...feature, status });
  };

  const updateTaskStatus = async (
    task: Task,
    feature: Feature,
    status: string,
  ) => {
    setDetailsTask({ task: { ...task, status }, feature });
  };

  const saveEpicDetails = async (epic: Epic) => {
    const response = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update-epic",
        id: epic.id,
        description: epic.description,
        acceptanceCriteria: epic.acceptanceCriteria,
        notes: epic.notes,
        status: epic.status,
        startDate: epic.start,
        endDate: epic.end,
      }),
    });
    if (response.ok) {
      await refreshRoadmapData();
      notify("Epic details saved.");
      return true;
    }
    notify("Epic details could not be saved.", "error");
    return false;
  };

  const saveFeatureDetails = async (feature: Feature) => {
    const response = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update-feature",
        id: feature.id,
        description: feature.description,
        acceptanceCriteria: feature.acceptanceCriteria,
        notes: feature.notes,
        status: feature.status,
        startDate: feature.start,
        endDate: feature.end,
      }),
    });
    if (response.ok) {
      await refreshRoadmapData();
      notify("Feature details saved.");
      return true;
    }
    notify("Feature details could not be saved.", "error");
    return false;
  };

  const saveTaskDetails = async (task: Task) => {
    const response = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update-task",
        id: task.id,
        description: task.description,
        status: task.status,
        startDate: task.startDate,
        endDate: task.endDate,
      }),
    });
    if (response.ok) {
      await refreshRoadmapData();
      notify("Task details saved.");
      return true;
    }
    notify("Task details could not be saved.", "error");
    return false;
  };

  const openFeatureMenu = (event: React.MouseEvent, feature: Feature) => {
    event.preventDefault();
    setFeatureMenu({ feature, x: event.clientX, y: event.clientY });
  };

  const openEpicMenu = (event: React.MouseEvent, epic: Epic) => {
    event.preventDefault();
    setEpicMenu({ epic, x: event.clientX, y: event.clientY });
  };

  const openTaskMenu = (
    event: React.MouseEvent,
    task: Task,
    feature: Feature,
  ) => {
    event.preventDefault();
    setTaskMenu({ task, feature, x: event.clientX, y: event.clientY });
  };

  const startColumnResize = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = workItemWidth;
    const resize = (moveEvent: MouseEvent) =>
      setWorkItemWidth(
        Math.max(120, Math.min(480, startWidth + moveEvent.clientX - startX)),
      );
    const stopResize = () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    };
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  };

  return (
    <main className="min-h-screen w-full bg-slate-100 p-[1in] text-slate-900">
      <div className="mx-auto w-full max-w-none space-y-6">
        <header className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-soft">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Roadmap visualization
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {roadmapMeta.name}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {roadmapMeta.startDate} to {roadmapMeta.endDate}
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
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
              <div className="mb-2 grid" style={timelineGridStyle}>
                <div className="relative border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Work item
                  <button
                    type="button"
                    onMouseDown={startColumnResize}
                    aria-label="Resize work item column"
                    className="absolute -right-1 top-0 z-20 h-full w-2 cursor-col-resize"
                  />
                </div>
                <div
                  className="grid border-b border-slate-200"
                  style={{
                    gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`,
                  }}
                >
                  {months.map((month) => (
                    <div
                      key={month.key}
                      className="border-l border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-500"
                    >
                      {month.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50/50">
                <div className="grid" style={timelineGridStyle}>
                  <div className="px-3 py-3 text-sm font-semibold text-brand-800">
                    Program increments
                  </div>
                  <div className="relative h-12 bg-white">
                    {months.map((month) => (
                      <div
                        key={month.key}
                        className="absolute inset-y-0 border-l border-slate-200"
                        style={{
                          left: `${calculateLeft(month.start, timelineStart, timelineEnd)}%`,
                        }}
                      />
                    ))}
                    {programIncrements.map((pi) => (
                      <div
                        key={pi.id}
                        className="absolute top-2 h-8 rounded border border-brand-600 bg-brand-500 px-2 py-1 text-xs font-semibold text-white"
                        style={{
                          left: `${calculateLeft(pi.startDate, timelineStart, timelineEnd)}%`,
                          width: `${calculateWidth(pi.startDate, pi.endDate, timelineStart, timelineEnd)}%`,
                        }}
                        title={`${pi.name}: ${pi.startDate} to ${pi.endDate}`}
                      >
                        <span className="block truncate">{pi.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/50">
                <div className="grid" style={timelineGridStyle}>
                  <div className="px-3 py-3 text-sm font-semibold text-amber-800">
                    Milestones
                  </div>
                  <div className="relative h-12 bg-white">
                    {months.map((month) => (
                      <div
                        key={month.key}
                        className="absolute inset-y-0 border-l border-slate-100"
                        style={{
                          left: `${calculateLeft(month.start, timelineStart, timelineEnd)}%`,
                        }}
                      />
                    ))}
                    {releaseMilestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="absolute top-1 h-10 -translate-x-1/2"
                        style={{
                          left: `${calculateLeft(milestone.date, timelineStart, timelineEnd)}%`,
                        }}
                        title={`${milestone.name}: ${milestone.date}`}
                      >
                        <div
                          className="mx-auto h-4 w-4 rotate-45 rounded-sm border-2"
                          style={{
                            backgroundColor: milestoneColor(milestone.status)
                              .markerBackground,
                            borderColor: milestoneColor(milestone.status)
                              .markerBorder,
                          }}
                        />
                        <span className="mt-1 block max-w-28 -translate-x-1/2 truncate text-center text-[10px] font-semibold text-amber-800">
                          {milestone.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {epics.map((epic) => (
                  <div
                    key={epic.id}
                    className="rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <div
                      className="grid items-center border-b border-slate-200"
                      style={timelineGridStyle}
                    >
                      <div
                        onContextMenu={(event) => openEpicMenu(event, epic)}
                        className="px-3 py-3"
                      >
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              toggleExpanded(setExpandedEpics, epic.id)
                            }
                            aria-label={`${expandedEpics.has(epic.id) ? "Collapse" : "Expand"} ${epic.name}`}
                            aria-expanded={expandedEpics.has(epic.id)}
                            className="w-4 text-left text-xs font-semibold text-slate-500"
                          >
                            {expandedEpics.has(epic.id) ? "v" : ">"}
                          </button>
                          <div className="text-xs font-semibold">
                            {epic.name}
                          </div>
                        </div>
                        <div className="pl-5 text-[11px] text-slate-500">
                          {epic.owner} · {epic.status}
                        </div>
                      </div>
                      <div className="relative h-12 bg-white">
                        {months.map((month) => (
                          <div
                            key={month.key}
                            className="absolute inset-y-0 border-l border-slate-100"
                            style={{
                              left: `${calculateLeft(month.start, timelineStart, timelineEnd)}%`,
                            }}
                          />
                        ))}
                        {releaseMilestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className="absolute inset-y-0 border-l-2 border-dashed"
                            style={{
                              left: `${calculateLeft(milestone.date, timelineStart, timelineEnd)}%`,
                              borderColor: milestoneColor(milestone.status)
                                .line,
                            }}
                          />
                        ))}
                        <div
                          onContextMenu={(event) => openEpicMenu(event, epic)}
                          className="absolute top-2 h-8 cursor-context-menu rounded px-2 py-1 text-xs font-semibold text-white"
                          style={{
                            left: `${calculateLeft(epic.start, timelineStart, timelineEnd)}%`,
                            width: `${calculateWidth(epic.start, epic.end, timelineStart, timelineEnd)}%`,
                            backgroundColor: epicBarColor(epic.status),
                          }}
                          title={`${epic.start} to ${epic.end}`}
                        >
                          <span className="block truncate">{epic.name}</span>
                        </div>
                      </div>
                    </div>
                    {expandedEpics.has(epic.id) &&
                      featuresByEpic(epic.id).map((feature) => (
                        <div key={feature.id}>
                          <div
                            className="grid items-center border-b border-slate-100"
                            style={timelineGridStyle}
                          >
                            <div
                              onContextMenu={(event) =>
                                openFeatureMenu(event, feature)
                              }
                              className="px-3 py-2 pl-6 text-xs text-slate-700"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  toggleExpanded(
                                    setExpandedFeatures,
                                    feature.id,
                                  )
                                }
                                aria-label={`${expandedFeatures.has(feature.id) ? "Collapse" : "Expand"} ${feature.name}`}
                                aria-expanded={expandedFeatures.has(feature.id)}
                                className="mr-1 w-4 text-left text-slate-400"
                              >
                                {expandedFeatures.has(feature.id) ? "v" : ">"}
                              </button>
                              {feature.name}
                            </div>
                            <div className="relative h-9 bg-white">
                              {months.map((month) => (
                                <div
                                  key={month.key}
                                  className="absolute inset-y-0 border-l border-slate-100"
                                  style={{
                                    left: `${calculateLeft(month.start, timelineStart, timelineEnd)}%`,
                                  }}
                                />
                              ))}
                              {releaseMilestones.map((milestone) => (
                                <div
                                  key={milestone.id}
                                  className="absolute inset-y-0 border-l-2 border-dashed"
                                  style={{
                                    left: `${calculateLeft(milestone.date, timelineStart, timelineEnd)}%`,
                                    borderColor: milestoneColor(
                                      milestone.status,
                                    ).line,
                                  }}
                                  title={milestone.name}
                                />
                              ))}
                              <div
                                onContextMenu={(event) =>
                                  openFeatureMenu(event, feature)
                                }
                                className="absolute top-1.5 h-6 cursor-context-menu rounded px-2 py-1 text-[11px] font-medium text-white"
                                style={{
                                  left: `${calculateLeft(feature.start, timelineStart, timelineEnd)}%`,
                                  width: `${calculateWidth(feature.start, feature.end, timelineStart, timelineEnd)}%`,
                                  backgroundColor: featureBarColor(
                                    feature.status,
                                  ),
                                }}
                                title={`${feature.name}: ${feature.start} to ${feature.end}`}
                              >
                                <span className="block truncate">
                                  {feature.name}
                                </span>
                              </div>
                              {milestones
                                .filter(
                                  (milestone) =>
                                    milestone.type === "Feature" &&
                                    milestone.featureId === feature.id,
                                )
                                .map((milestone) => (
                                  <div
                                    key={milestone.id}
                                    className="absolute top-0.5 z-10 h-4 w-4 -translate-x-1/2 rotate-45 rounded-sm border-2"
                                    style={{
                                      left: `${calculateLeft(milestone.date, timelineStart, timelineEnd)}%`,
                                      backgroundColor: milestoneColor(
                                        milestone.status,
                                      ).markerBackground,
                                      borderColor: milestoneColor(
                                        milestone.status,
                                      ).markerBorder,
                                    }}
                                    title={`${milestone.name}: ${milestone.date}`}
                                  />
                                ))}
                            </div>
                          </div>
                          {expandedFeatures.has(feature.id) && (
                            <>
                              {feature.tasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="grid items-center border-b border-slate-100 bg-slate-50/60"
                                  style={timelineGridStyle}
                                >
                                  <div
                                    onContextMenu={(event) =>
                                      openTaskMenu(event, task, feature)
                                    }
                                    className="cursor-context-menu px-3 py-1.5 pl-11 text-[11px] text-slate-600"
                                  >
                                    <span className="font-medium text-slate-700">
                                      {task.title}
                                    </span>
                                    <span className="ml-2">{task.status}</span>
                                  </div>
                                  <div className="relative h-9 bg-white">
                                    <div
                                      onContextMenu={(event) =>
                                        openTaskMenu(event, task, feature)
                                      }
                                      className="absolute top-[7px] h-[22px] cursor-context-menu rounded px-2 py-1 text-[11px] font-medium text-white"
                                      style={{
                                        left: `${calculateLeft(task.startDate, timelineStart, timelineEnd)}%`,
                                        width: `${calculateWidth(task.startDate, task.endDate, timelineStart, timelineEnd)}%`,
                                        backgroundColor: featureBarColor(
                                          task.status,
                                        ),
                                      }}
                                      title={`${task.title}: ${task.startDate} to ${task.endDate}`}
                                    >
                                      <span className="block truncate">
                                        {task.title}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
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
          <form
            onSubmit={createMilestone}
            className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_160px_150px_minmax(0,1fr)_160px_auto]"
          >
            <input
              value={milestoneForm.name}
              onChange={(event) =>
                setMilestoneForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Milestone name"
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={milestoneForm.date}
              onChange={(event) =>
                setMilestoneForm((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            />
            <select
              value={milestoneForm.type}
              onChange={(event) =>
                setMilestoneForm((current) => ({
                  ...current,
                  type: event.target.value as "Release" | "Feature",
                  featureId: "",
                }))
              }
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            >
              <option value="Release">Release marker</option>
              <option value="Feature">Feature marker</option>
            </select>
            {milestoneForm.type === "Feature" ? (
              <select
                value={milestoneForm.featureId}
                onChange={(event) =>
                  setMilestoneForm((current) => ({
                    ...current,
                    featureId: event.target.value,
                  }))
                }
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              >
                <option value="">Select feature</option>
                {features.map((feature) => (
                  <option key={feature.id} value={feature.id}>
                    {feature.name}
                  </option>
                ))}
              </select>
            ) : (
              <div />
            )}
            <select
              value={milestoneForm.status}
              onChange={(event) =>
                setMilestoneForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            >
              <option value="Green">Green</option>
              <option value="Yellow">Yellow</option>
              <option value="Red">Red</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
            >
              Add milestone
            </button>
          </form>
          <div className="space-y-2">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_160px_150px_minmax(0,1fr)_160px_auto_auto]"
              >
                <input
                  value={milestone.name}
                  onChange={(event) =>
                    editMilestoneLocally(milestone.id, {
                      name: event.target.value,
                    })
                  }
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                />
                <input
                  type="date"
                  value={milestone.date}
                  onChange={(event) =>
                    editMilestoneLocally(milestone.id, {
                      date: event.target.value,
                    })
                  }
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                />
                <select
                  value={milestone.type}
                  onChange={(event) => {
                    const type = event.target.value as "Release" | "Feature";
                    editMilestoneLocally(milestone.id, {
                      type,
                      featureId:
                        type === "Feature"
                          ? milestone.featureId || features[0]?.id || ""
                          : "",
                    });
                  }}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                >
                  <option value="Release">Release</option>
                  <option value="Feature">Feature</option>
                </select>
                <select
                  value={milestone.featureId}
                  disabled={milestone.type !== "Feature"}
                  onChange={(event) =>
                    editMilestoneLocally(milestone.id, {
                      featureId: event.target.value,
                    })
                  }
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                >
                  <option value="">
                    {milestone.type === "Feature"
                      ? "Select feature"
                      : "All roadmap items"}
                  </option>
                  {features.map((feature) => (
                    <option key={feature.id} value={feature.id}>
                      {feature.name}
                    </option>
                  ))}
                </select>
                <select
                  value={milestone.status}
                  onChange={(event) =>
                    editMilestoneLocally(milestone.id, {
                      status: event.target.value,
                    })
                  }
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                >
                  <option value="Green">Green</option>
                  <option value="Yellow">Yellow</option>
                  <option value="Red">Red</option>
                </select>
                <button
                  type="button"
                  onClick={() => saveMilestone(milestone)}
                  className="rounded bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  Update milestone
                </button>
                <button
                  type="button"
                  onClick={() => deleteMilestone(milestone.id)}
                  className="rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {featureMenu && (
        <div
          role="menu"
          className="fixed z-50 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
          style={{ left: featureMenu.x, top: featureMenu.y }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setDetailsFeature(featureMenu.feature);
              setFeatureMenu(null);
            }}
            className="w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
          >
            View details
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setTaskFeature(featureMenu.feature);
              setFeatureMenu(null);
            }}
            className="w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
          >
            Add task
          </button>
        </div>
      )}

      {epicMenu && (
        <div
          role="menu"
          className="fixed z-50 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
          style={{ left: epicMenu.x, top: epicMenu.y }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setDetailsEpic(epicMenu.epic);
              setEpicMenu(null);
            }}
            className="w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
          >
            View details
          </button>
        </div>
      )}

      {taskMenu && (
        <div
          role="menu"
          className="fixed z-50 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
          style={{ left: taskMenu.x, top: taskMenu.y }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setDetailsTask({
                task: taskMenu.task,
                feature: taskMenu.feature,
              });
              setTaskMenu(null);
            }}
            className="w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
          >
            View details
          </button>
        </div>
      )}

      {detailsEpic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={() => setDetailsEpic(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="epic-details-title"
            className="w-full max-w-[900px] rounded-lg bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Start date
                <input
                  type="date"
                  value={detailsEpic.start}
                  onChange={(event) =>
                    setDetailsEpic({
                      ...detailsEpic,
                      start: event.target.value,
                    })
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                End date
                <input
                  type="date"
                  value={detailsEpic.end}
                  onChange={(event) =>
                    setDetailsEpic({ ...detailsEpic, end: event.target.value })
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                />
              </label>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Epic details
                </p>
                <h2
                  id="epic-details-title"
                  className="mt-1 text-xl font-semibold text-slate-900"
                >
                  {detailsEpic.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailsEpic(null)}
                aria-label="Close epic details"
                className="rounded p-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                x
              </button>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Owner</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {detailsEpic.owner}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1">
                  <select
                    value={detailsEpic.status}
                    onChange={(event) =>
                      updateEpicStatus(detailsEpic, event.target.value)
                    }
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 font-medium text-slate-800"
                  >
                    <option>Planned</option>
                    <option>On track</option>
                    <option>At risk</option>
                    <option>Completed</option>
                  </select>
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Schedule</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {detailsEpic.start} to {detailsEpic.end}
                </dd>
              </div>
            </dl>
            <div className="mt-5 grid gap-4 border-t border-slate-200 pt-4">
              <RichTextEditor label="Description" value={detailsEpic.description} onChange={(description) => setDetailsEpic({ ...detailsEpic, description })} />
              <RichTextEditor label="Acceptance criteria" value={detailsEpic.acceptanceCriteria} onChange={(acceptanceCriteria) => setDetailsEpic({ ...detailsEpic, acceptanceCriteria })} />
              <RichTextEditor label="Notes" value={detailsEpic.notes} onChange={(notes) => setDetailsEpic({ ...detailsEpic, notes })} />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => saveEpicDetails(detailsEpic)}
                  className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                >
                  Save
                </button>
                <button type="button" onClick={async () => { if (await saveEpicDetails(detailsEpic)) setDetailsEpic(null); }} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  Save &amp; close
                </button>
              </div>
            </div>
            <div className="mt-5 border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Features ({featuresByEpic(detailsEpic.id).length})
              </h3>
              <ul className="mt-2 space-y-1">
                {featuresByEpic(detailsEpic.id).map((feature) => (
                  <li key={feature.id} className="text-sm text-slate-700">
                    {feature.name}{" "}
                    <span className="text-slate-500">{feature.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}

      {detailsTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={() => setDetailsTask(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-details-title"
            className="w-full max-w-[900px] rounded-lg bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Start date
                <input
                  type="date"
                  value={detailsTask.task.startDate}
                  onChange={(event) =>
                    setDetailsTask({
                      ...detailsTask,
                      task: {
                        ...detailsTask.task,
                        startDate: event.target.value,
                      },
                    })
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                End date
                <input
                  type="date"
                  value={detailsTask.task.endDate}
                  onChange={(event) =>
                    setDetailsTask({
                      ...detailsTask,
                      task: {
                        ...detailsTask.task,
                        endDate: event.target.value,
                      },
                    })
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                />
              </label>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Task details
                </p>
                <h2
                  id="task-details-title"
                  className="mt-1 text-xl font-semibold text-slate-900"
                >
                  {detailsTask.task.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailsTask(null)}
                aria-label="Close task details"
                className="rounded p-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                x
              </button>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Feature</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {detailsTask.feature.name}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1">
                  <select
                    value={detailsTask.task.status}
                    onChange={(event) =>
                      updateTaskStatus(
                        detailsTask.task,
                        detailsTask.feature,
                        event.target.value,
                      )
                    }
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 font-medium text-slate-800"
                  >
                    <option>Planned</option>
                    <option>Committed</option>
                    <option>In progress</option>
                    <option>Blocked</option>
                    <option>Completed</option>
                  </select>
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Schedule</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {detailsTask.task.startDate} to {detailsTask.task.endDate}
                </dd>
              </div>
            </dl>
            <div className="mt-5 grid gap-4 border-t border-slate-200 pt-4">
              <RichTextEditor label="Description" value={detailsTask.task.description} onChange={(description) => setDetailsTask({ ...detailsTask, task: { ...detailsTask.task, description } })} />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => saveTaskDetails(detailsTask.task)}
                  className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                >
                  Save
                </button>
                <button type="button" onClick={async () => { if (await saveTaskDetails(detailsTask.task)) setDetailsTask(null); }} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  Save &amp; close
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {detailsFeature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={() => setDetailsFeature(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="feature-details-title"
            className="w-full max-w-[900px] rounded-lg bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Start date
                <input
                  type="date"
                  value={detailsFeature.start}
                  onChange={(event) =>
                    setDetailsFeature({
                      ...detailsFeature,
                      start: event.target.value,
                    })
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                End date
                <input
                  type="date"
                  value={detailsFeature.end}
                  onChange={(event) =>
                    setDetailsFeature({
                      ...detailsFeature,
                      end: event.target.value,
                    })
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                />
              </label>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Feature details
                </p>
                <h2
                  id="feature-details-title"
                  className="mt-1 text-xl font-semibold text-slate-900"
                >
                  {detailsFeature.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailsFeature(null)}
                aria-label="Close feature details"
                className="rounded p-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                x
              </button>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1">
                  <select
                    value={detailsFeature.status}
                    onChange={(event) =>
                      updateFeatureStatus(detailsFeature, event.target.value)
                    }
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-800"
                  >
                    <option>Planned</option>
                    <option>Committed</option>
                    <option>In progress</option>
                    <option>Blocked</option>
                    <option>Completed</option>
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Team</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {detailsFeature.team}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Program increment</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {detailsFeature.pi || "Not assigned"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Schedule</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {detailsFeature.start} to {detailsFeature.end}
                </dd>
              </div>
            </dl>
            <div className="mt-5 grid gap-4 border-t border-slate-200 pt-4">
              <RichTextEditor label="Description" value={detailsFeature.description} onChange={(description) => setDetailsFeature({ ...detailsFeature, description })} />
              <RichTextEditor label="Acceptance criteria" value={detailsFeature.acceptanceCriteria} onChange={(acceptanceCriteria) => setDetailsFeature({ ...detailsFeature, acceptanceCriteria })} />
              <RichTextEditor label="Notes" value={detailsFeature.notes} onChange={(notes) => setDetailsFeature({ ...detailsFeature, notes })} />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => saveFeatureDetails(detailsFeature)}
                  className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                >
                  Save
                </button>
                <button type="button" onClick={async () => { if (await saveFeatureDetails(detailsFeature)) setDetailsFeature(null); }} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  Save &amp; close
                </button>
              </div>
            </div>
            <div className="mt-5 border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Tasks ({detailsFeature.tasks.length})
              </h3>
              {detailsFeature.tasks.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {detailsFeature.tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="font-medium text-slate-700">
                        {task.title}
                      </span>
                      <span className="text-xs text-slate-500">
                        {task.status} | {task.startDate} to {task.endDate}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No tasks yet.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {taskFeature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={() => setTaskFeature(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-task-title"
            className="w-full max-w-[900px] rounded-lg bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  New task
                </p>
                <h2
                  id="add-task-title"
                  className="mt-1 text-xl font-semibold text-slate-900"
                >
                  {taskFeature.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTaskFeature(null)}
                aria-label="Close add task dialog"
                className="rounded p-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                x
              </button>
            </div>
            <form
              onSubmit={(event) => createTask(taskFeature, event)}
              className="mt-5 grid gap-4"
            >
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Task name
                <input
                  required
                  value={taskFormFor(taskFeature).title}
                  onChange={(event) =>
                    setTaskForms((current) => ({
                      ...current,
                      [taskFeature.id]: {
                        ...taskFormFor(taskFeature),
                        title: event.target.value,
                      },
                    }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Status
                <select
                  value={taskFormFor(taskFeature).status}
                  onChange={(event) =>
                    setTaskForms((current) => ({
                      ...current,
                      [taskFeature.id]: {
                        ...taskFormFor(taskFeature),
                        status: event.target.value,
                      },
                    }))
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                >
                  <option>Planned</option>
                  <option>Committed</option>
                  <option>In progress</option>
                  <option>Blocked</option>
                  <option>Completed</option>
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Start date
                  <input
                    required
                    type="date"
                    value={taskFormFor(taskFeature).startDate}
                    onChange={(event) =>
                      setTaskForms((current) => ({
                        ...current,
                        [taskFeature.id]: {
                          ...taskFormFor(taskFeature),
                          startDate: event.target.value,
                        },
                      }))
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  End date
                  <input
                    required
                    type="date"
                    value={taskFormFor(taskFeature).endDate}
                    onChange={(event) =>
                      setTaskForms((current) => ({
                        ...current,
                        [taskFeature.id]: {
                          ...taskFormFor(taskFeature),
                          endDate: event.target.value,
                        },
                      }))
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTaskFeature(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Add task
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      <Toasts messages={toastMessages} onDismiss={(id) => setToastMessages((current) => current.filter((message) => message.id !== id))} />
    </main>
  );
}
