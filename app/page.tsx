"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { RichTextEditor } from "./components/rich-text-editor";
import { Toasts, type ToastMessage } from "./components/toast";

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
  epicId: string;
  description: string;
  acceptanceCriteria: string;
  notes: string;
};

type BacklogItem = {
  id: string;
  name: string;
  priority: number;
  status: string;
  epicId: string;
  epicName: string;
  programIncrementId?: string;
  programIncrementName?: string;
};

type Epic = {
  id: string;
  name: string;
  owner: string;
  start: string;
  end: string;
  status: string;
  description: string;
  acceptanceCriteria: string;
  notes: string;
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
    savedAt?: string | null;
  };
  epics?: Array<{
    id?: string;
    title?: string;
    owner?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    description?: string | null;
    acceptanceCriteria?: string | null;
    notes?: string | null;
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
    epicId?: string;
    description?: string | null;
    acceptanceCriteria?: string | null;
    notes?: string | null;
    epic?: { id?: string; title?: string };
    programIncrementId?: string;
    programIncrement?: { id?: string; name?: string };
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
    epicId?: string;
    epic?: { id?: string; title?: string };
    programIncrementId?: string;
    programIncrement?: { id?: string; name?: string };
  }>;
};
const defaultRoadmap = {
  name: "ROADMAP",
  startDate: "2026-09-01",
  endDate: "2027-03-31",
};

function SortableFeatureCard({
  feature,
  children,
}: {
  feature: Feature;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id: feature.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, touchAction: "none" }}
      className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">
            #{feature.rank} {feature.name}
          </div>
          <div className="text-xs text-slate-500">
            {feature.team} • {feature.pi}
          </div>
        </div>
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Drag ${feature.name} to change rank`}
          className="cursor-grab rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-200 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          Rank {feature.rank}
        </button>
      </div>
      {children}
    </div>
  );
}

function SortableBacklogCard({ item }: { item: BacklogItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

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
    >
      <span className="font-medium">{item.name}</span>
      <span className="text-sm text-slate-500">#{item.priority}</span>
    </div>
  );
}

function DetailDateFields({
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Start date
        <input
          type="date"
          value={start}
          onChange={(event) => onStartChange(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        End date
        <input
          type="date"
          value={end}
          onChange={(event) => onEndChange(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
        />
      </label>
    </div>
  );
}

export default function HomePage() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [programIncrements, setProgramIncrements] = useState<
    ProgramIncrement[]
  >([]);
  const [roadmapMeta, setRoadmapMeta] = useState({
    name: defaultRoadmap.name,
    startDate: defaultRoadmap.startDate,
    endDate: defaultRoadmap.endDate,
  });
  const [roadmapSavedAt, setRoadmapSavedAt] = useState<string | null>(null);
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [planningTab, setPlanningTab] = useState<
    "priority" | "backlog" | "epics" | "program-increments"
  >("priority");
  const [backlogForm, setBacklogForm] = useState({
    title: "",
    status: "New",
    epicName: "",
  });
  const [piForm, setPiForm] = useState({
    name: "",
    startDate: defaultRoadmap.startDate,
    endDate: defaultRoadmap.endDate,
  });
  const [editingPiId, setEditingPiId] = useState<string | null>(null);
  const [editingPiData, setEditingPiData] =
    useState<Partial<ProgramIncrement> | null>(null);
  const [piActionLoading, setPiActionLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [detailsEpic, setDetailsEpic] = useState<Epic | null>(null);
  const [detailsFeature, setDetailsFeature] = useState<Feature | null>(null);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  const [loading, setLoading] = useState(true);

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
        start: item.startDate ?? defaultRoadmap.startDate,
        end: item.endDate ?? defaultRoadmap.endDate,
        status: item.status ?? "Planned",
        description: item.description ?? "",
        acceptanceCriteria: item.acceptanceCriteria ?? "",
        notes: item.notes ?? "",
      }));

      const mappedFeatures: Feature[] = (payload.features ?? []).map(
        (item) => ({
          id: item.id ?? `feature-${Math.random()}`,
          name: item.title ?? "Untitled feature",
          rank: item.rank ?? 0,
          pi: item.pi ?? "PI-01",
          team: item.team ?? "Program",
          start: item.startDate ?? defaultRoadmap.startDate,
          end: item.endDate ?? defaultRoadmap.endDate,
          status: item.status ?? "Planned",
          epic: item.epic?.title ?? item.epicId ?? "Unassigned",
          epicId: item.epicId ?? item.epic?.id ?? "",
          description: item.description ?? "",
          acceptanceCriteria: item.acceptanceCriteria ?? "",
          notes: item.notes ?? "",
        }),
      );

      const mappedBacklog: BacklogItem[] = (payload.backlog ?? []).map(
        (item) => ({
          id: item.id ?? `backlog-${Math.random()}`,
          name: item.title ?? "Untitled backlog item",
          priority: item.priority ?? 0,
          status: item.status ?? "New",
          epicId: item.epicId ?? "",
          programIncrementId: item.programIncrementId ?? "",
          programIncrementName: item.programIncrement?.name ?? "",
          epicName: item.epic?.title ?? "",
        }),
      );

      const mappedProgramIncrements: ProgramIncrement[] = (
        payload.programIncrements ?? []
      ).map((item) => ({
        id: item.id ?? `pi-${Math.random()}`,
        name: item.name ?? "PI-01",
        startDate: item.startDate ?? defaultRoadmap.startDate,
        endDate: item.endDate ?? defaultRoadmap.endDate,
      }));

      setRoadmapMeta({
        name: payload.roadmap?.name ?? defaultRoadmap.name,
        startDate: payload.roadmap?.startDate ?? defaultRoadmap.startDate,
        endDate: payload.roadmap?.endDate ?? defaultRoadmap.endDate,
      });
      setRoadmapSavedAt(payload.roadmap?.savedAt ?? null);
      setEpics(mappedEpics);
      setFeatures(mappedFeatures);
      setBacklog(mappedBacklog);
      setProgramIncrements(
        mappedProgramIncrements.length > 0 ? mappedProgramIncrements : [],
      );
    } catch (error) {
      console.error("Failed to load roadmap data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshRoadmapData();
  }, []);

  // Sync PI form dates with roadmap dates when roadmapMeta changes
  useEffect(() => {
    setPiForm((current) => ({
      ...current,
      startDate: roadmapMeta.startDate,
      endDate: roadmapMeta.endDate,
    }));
  }, [roadmapMeta.startDate, roadmapMeta.endDate]);

  const handleSaveRoadmap = async () => {
    setSavingRoadmap(true);
    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save-roadmap" }),
      });
      if (!response.ok) throw new Error("Unable to save roadmap");
      const data = await response.json();
      setRoadmapSavedAt(data.roadmap?.savedAt ?? new Date().toISOString());
      notify("Roadmap saved.");
    } catch (error) {
      console.error("Failed to save roadmap", error);
      notify("Roadmap could not be saved.", "error");
    } finally {
      setSavingRoadmap(false);
    }
  };

  const roadmapSummary = useMemo(
    () => [
      ["Roadmaps", String(1)],
      ["Epics", String(epics.length)],
      ["Features", String(features.length)],
      ["Backlog", String(backlog.length)],
    ],
    [backlog.length, epics.length, features.length],
  );

  const statusCounts = useMemo(() => {
    const countByStatus = (
      items: Array<{ status: string }>,
      statuses: string[],
    ) =>
      statuses.map(
        (status) =>
          [
            status,
            items.filter((item) => item.status === status).length,
          ] as const,
      );

    return {
      epics: countByStatus(epics, [
        "Planned",
        "On track",
        "At risk",
        "Completed",
      ]),
      features: countByStatus(features, [
        "Planned",
        "Committed",
        "In progress",
        "Blocked",
        "Completed",
      ]),
    };
  }, [epics, features]);

  const featureGroups = useMemo(() => {
    const groups = epics.map((epic) => ({
      epic,
      features: features.filter((feature) => feature.epicId === epic.id),
    }));
    const unassigned = features.filter((feature) => !feature.epicId);
    if (unassigned.length > 0)
      groups.push({
        epic: {
          id: "",
          name: "Unassigned",
          owner: "",
          start: "",
          end: "",
          status: "",
          description: "",
          acceptanceCriteria: "",
          notes: "",
        },
        features: unassigned,
      });
    return groups;
  }, [epics, features]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleFeatureDragEnd = async (event: DragEndEvent, epicId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = features.findIndex(
      (feature) => feature.id === String(active.id),
    );
    const newIndex = features.findIndex(
      (feature) => feature.id === String(over.id),
    );
    if (oldIndex === -1 || newIndex === -1) return;

    const activeFeature = features[oldIndex];
    if (activeFeature.epicId !== epicId || features[newIndex].epicId !== epicId)
      return;

    const group = features.filter((feature) => feature.epicId === epicId);
    const groupOldIndex = group.findIndex(
      (feature) => feature.id === String(active.id),
    );
    const groupNewIndex = group.findIndex(
      (feature) => feature.id === String(over.id),
    );
    const reorderedGroup = arrayMove(group, groupOldIndex, groupNewIndex).map(
      (feature, index) => ({ ...feature, rank: index + 1 }),
    );
    const reordered = features.map(
      (feature) =>
        reorderedGroup.find((item) => item.id === feature.id) ?? feature,
    );

    setFeatures(reordered);

    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder-features",
          order: reorderedGroup.map((item) => ({
            id: item.id,
            rank: item.rank,
          })),
        }),
      });
      if (!response.ok) throw new Error("Feature rank update failed");
      await refreshRoadmapData();
    } catch (error) {
      console.error("Failed to persist feature ordering", error);
      await refreshRoadmapData();
    }
  };

  const handleBacklogDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = backlog.findIndex((item) => item.id === String(active.id));
    const newIndex = backlog.findIndex((item) => item.id === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(backlog, oldIndex, newIndex).map(
      (item, index) => ({
        ...item,
        priority: index + 1,
      }),
    );

    setBacklog(reordered);

    try {
      await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder-backlog",
          order: reordered.map((item) => item.id),
        }),
      });
    } catch (error) {
      console.error("Failed to persist backlog ordering", error);
    }
  };

  const handleUpdateFeature = async (id: string, updates: Partial<Feature>) => {
    setFeatures((current) =>
      current.map((feature) =>
        feature.id === id ? { ...feature, ...updates } : feature,
      ),
    );

    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-feature",
          id,
          title: updates.name,
          team: updates.team,
          pi: updates.pi,
          status: updates.status,
          startDate: updates.start,
          endDate: updates.end,
          epicId: updates.epicId,
          description: updates.description,
          acceptanceCriteria: updates.acceptanceCriteria,
          notes: updates.notes,
        }),
      });
      if (!response.ok) throw new Error("Feature update failed");
      await refreshRoadmapData();
      return true;
    } catch (error) {
      console.error("Failed to update feature", error);
      await refreshRoadmapData();
      return false;
    }
  };

  const handleCreateBacklog = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!backlogForm.title.trim()) return;

    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-backlog",
          title: backlogForm.title.trim(),
          status: backlogForm.status,
          epicId:
            epics.find((epic) => epic.name === backlogForm.epicName)?.id ??
            null,
        }),
      });
      if (!response.ok) throw new Error("Backlog item creation failed");

      setBacklogForm({ title: "", status: "New", epicName: "" });
      await refreshRoadmapData();
      notify("Backlog item added.");
    } catch (error) {
      console.error("Failed to create backlog item", error);
      notify("Backlog item could not be added.", "error");
    }
  };

  const handleCreateEpic = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem(
      "epic-title",
    ) as HTMLInputElement | null;
    const title = input?.value?.trim();
    if (!title) return;

    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-epic",
          title,
          status: "Planned",
          startDate: roadmapMeta.startDate,
          endDate: roadmapMeta.endDate,
        }),
      });
      if (!response.ok) throw new Error("Epic creation failed");

      if (input) input.value = "";
      await refreshRoadmapData();
      notify("Epic added.");
    } catch (error) {
      console.error("Failed to create epic", error);
      notify("Epic could not be added.", "error");
    }
  };

  const handleCreateProgramIncrement = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!piForm.name.trim() || !piForm.startDate || !piForm.endDate) {
      console.warn("PI form validation failed - missing required fields");
      return;
    }

    setPiActionLoading((current) => ({ ...current, create: true }));

    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-pi",
          name: piForm.name.trim(),
          startDate: piForm.startDate,
          endDate: piForm.endDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Create PI failed:", data);
        alert(`Error creating PI: ${data.error || "Unknown error"}`);
        return;
      }

      console.log("PI created successfully:", data);

      // Reset form with current roadmap dates
      setPiForm({
        name: "",
        startDate: roadmapMeta.startDate,
        endDate: roadmapMeta.endDate,
      });
      await refreshRoadmapData();
      notify("Program increment added.");
    } catch (error) {
      console.error("Failed to create program increment:", error);
      notify("Program increment could not be added.", "error");
      alert(
        "Failed to create program increment. Check the console for details.",
      );
    } finally {
      setPiActionLoading((current) => ({ ...current, create: false }));
    }
  };

  const handleUpdateEpic = async (id: string, updates: Partial<Epic>) => {
    // Update local state immediately for instant feedback
    setEpics((current) =>
      current.map((epic) => (epic.id === id ? { ...epic, ...updates } : epic)),
    );

    // Then persist to server
    try {
      await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-epic",
          id,
          title: updates.name,
          status: updates.status,
          startDate: updates.start,
          endDate: updates.end,
          description: updates.description,
          acceptanceCriteria: updates.acceptanceCriteria,
          notes: updates.notes,
        }),
      });

      await refreshRoadmapData();
      return true;
    } catch (error) {
      console.error("Failed to update epic", error);
      // Refresh data on error to revert any local changes
      await refreshRoadmapData();
      return false;
    }
  };

  const saveEpicDetails = async (epic: Epic) => {
    const saved = await handleUpdateEpic(epic.id, epic);
    notify(saved ? "Epic details saved." : "Epic details could not be saved.", saved ? "success" : "error");
    return saved;
  };

  const saveFeatureDetails = async (feature: Feature) => {
    const saved = await handleUpdateFeature(feature.id, feature);
    notify(saved ? "Feature details saved." : "Feature details could not be saved.", saved ? "success" : "error");
    return saved;
  };

  const handleDeleteEpic = async (id: string) => {
    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-epic", id }),
      });
      if (!response.ok) throw new Error("Epic deletion failed");

      await refreshRoadmapData();
      notify("Epic deleted.");
    } catch (error) {
      console.error("Failed to delete epic", error);
      notify("Epic could not be deleted.", "error");
    }
  };

  const handleDeleteFeature = async (id: string) => {
    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-feature", id }),
      });
      if (!response.ok) throw new Error("Feature deletion failed");

      setDetailsFeature((current) => (current?.id === id ? null : current));
      await refreshRoadmapData();
      notify("Feature deleted.");
    } catch (error) {
      console.error("Failed to delete feature", error);
      notify("Feature could not be deleted.", "error");
    }
  };

  const handleUpdateProgramIncrement = async (
    id: string,
    updates: Partial<ProgramIncrement>,
  ) => {
    if (!updates.name || !updates.startDate || !updates.endDate) {
      console.warn("PI update validation failed - missing required fields");
      alert("Please fill in all required fields (name, start date, end date)");
      return;
    }

    setPiActionLoading((current) => ({ ...current, [id]: true }));

    // Update local state immediately for instant feedback
    setProgramIncrements((current) =>
      current.map((pi) => (pi.id === id ? { ...pi, ...updates } : pi)),
    );

    // Then persist to server
    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-pi",
          id,
          name: updates.name,
          startDate: updates.startDate,
          endDate: updates.endDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Update failed:", data);
        alert(`Error updating PI: ${data.error || "Unknown error"}`);
        // Refresh data on error to revert any local changes
        await refreshRoadmapData();
        return;
      }

      console.log("PI updated successfully");
      setEditingPiId(null);
      setEditingPiData(null);
      await refreshRoadmapData();
      notify("Program increment saved.");
    } catch (error) {
      console.error("Failed to update program increment:", error);
      alert(
        "Failed to update program increment. Check the console for details.",
      );
      // Refresh data on error to revert any local changes
      await refreshRoadmapData();
    } finally {
      setPiActionLoading((current) => {
        const updated = { ...current };
        delete updated[id];
        return updated;
      });
    }
  };

  const handleDeleteProgramIncrement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Program Increment?")) {
      return;
    }

    setPiActionLoading((current) => ({ ...current, [id]: true }));

    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-pi", id }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Delete failed:", data);
        alert(`Error deleting PI: ${data.error || "Unknown error"}`);
        return;
      }

      console.log("PI deleted successfully");

      // Update local state immediately for instant feedback
      setProgramIncrements((current) => current.filter((pi) => pi.id !== id));
      await refreshRoadmapData();
      notify("Program increment deleted.");
    } catch (error) {
      console.error("Failed to delete program increment:", error);
      notify("Program increment could not be deleted.", "error");
      alert(
        "Failed to delete program increment. Check the console for details.",
      );
    } finally {
      setPiActionLoading((current) => {
        const updated = { ...current };
        delete updated[id];
        return updated;
      });
    }
  };

  const handleUpdateRoadmap = async (updates: Partial<typeof roadmapMeta>) => {
    try {
      await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-roadmap",
          name: updates.name,
          startDate: updates.startDate,
          endDate: updates.endDate,
        }),
      });

      await refreshRoadmapData();
    } catch (error) {
      console.error("Failed to update roadmap dates", error);
    }
  };

  const handleDeleteBacklog = async (id: string) => {
    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-backlog", id }),
      });
      if (!response.ok) throw new Error("Backlog item deletion failed");

      await refreshRoadmapData();
      notify("Backlog item deleted.");
    } catch (error) {
      console.error("Failed to delete backlog item", error);
      notify("Backlog item could not be deleted.", "error");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-800">
        <div className="rounded-2xl bg-white px-6 py-4 shadow-soft">
          Loading roadmap...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-soft">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Program portfolio
            </p>
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
                  const next = {
                    ...roadmapMeta,
                    startDate: event.target.value,
                  };
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
            <a
              href="/roadmaps"
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Roadmaps
            </a>
            <button
              type="button"
              onClick={handleSaveRoadmap}
              disabled={savingRoadmap}
              className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 disabled:opacity-50"
            >
              {savingRoadmap
                ? "Saving..."
                : roadmapSavedAt
                  ? "Save roadmap again"
                  : "Save roadmap"}
            </button>
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
              New roadmap
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {roadmapSummary.map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
            >
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-3 text-3xl font-bold">{value}</div>
              {(label === "Epics" || label === "Features") && (
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                  {(label === "Epics"
                    ? statusCounts.epics
                    : statusCounts.features
                  ).map(([status, count]) => (
                    <span key={status}>
                      <span className="font-medium text-slate-700">
                        {status}:
                      </span>{" "}
                      {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        <div className="flex w-fit flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setPlanningTab("epics")}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${planningTab === "epics" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Epic Backlog
          </button>
          <button
            type="button"
            onClick={() => setPlanningTab("program-increments")}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${planningTab === "program-increments" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Program increments
          </button>
          <button
            type="button"
            onClick={() => setPlanningTab("backlog")}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${planningTab === "backlog" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Feature backlog
          </button>
          <button
            type="button"
            onClick={() => setPlanningTab("priority")}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${planningTab === "priority" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Priority stack
          </button>
        </div>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Roadmap chart</h2>
              <a
                href="/chart"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                View full chart →
              </a>
            </div>
            <p className="text-sm text-slate-600">
              Open the roadmap timeline visualization in a dedicated view to see
              all epics and program increments.
            </p>
          </div>
        </section>

        {planningTab === "program-increments" && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-4 text-xl font-semibold">Program increments</h2>
              <form
                onSubmit={handleCreateProgramIncrement}
                className="mb-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <input
                  value={piForm.name}
                  onChange={(event) =>
                    setPiForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="PI name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <input
                    type="date"
                    value={piForm.startDate}
                    onChange={(event) =>
                      setPiForm((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <input
                    type="date"
                    value={piForm.endDate}
                    onChange={(event) =>
                      setPiForm((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={piActionLoading.create}
                    className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {piActionLoading.create ? "Adding..." : "Add PI"}
                  </button>
                </div>
              </form>
              <div className="space-y-3">
                {programIncrements.map((pi) => {
                  const isEditing = editingPiId === pi.id;
                  const editData =
                    isEditing && editingPiData ? editingPiData : pi;

                  return (
                    <div
                      key={pi.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2"
                    >
                      <div className="grid gap-2 grid-cols-1 md:grid-cols-[1fr_1fr_1fr]">
                        <input
                          value={editData.name ?? pi.name}
                          onChange={(event) => {
                            setEditingPiId(pi.id);
                            setEditingPiData((current) => ({
                              ...current,
                              name: event.target.value,
                            }));
                          }}
                          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                        />
                        <input
                          type="date"
                          value={editData.startDate ?? pi.startDate}
                          onChange={(event) => {
                            setEditingPiId(pi.id);
                            setEditingPiData((current) => ({
                              ...current,
                              startDate: event.target.value,
                            }));
                          }}
                          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                        />
                        <input
                          type="date"
                          value={editData.endDate ?? pi.endDate}
                          onChange={(event) => {
                            setEditingPiId(pi.id);
                            setEditingPiData((current) => ({
                              ...current,
                              endDate: event.target.value,
                            }));
                          }}
                          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        {isEditing && (
                          <button
                            type="button"
                            disabled={piActionLoading[pi.id]}
                            onClick={async () => {
                              await handleUpdateProgramIncrement(pi.id, {
                                ...pi,
                                ...editingPiData,
                              });
                              setEditingPiId(null);
                              setEditingPiData(null);
                            }}
                            className="flex-1 md:flex-none rounded border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {piActionLoading[pi.id]
                              ? "Saving..."
                              : "Save changes"}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={piActionLoading[pi.id]}
                          onClick={() => handleDeleteProgramIncrement(pi.id)}
                          className="flex-1 md:flex-none rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {piActionLoading[pi.id] ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {planningTab === "epics" && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-4 text-xl font-semibold">Epics</h2>
              <form onSubmit={handleCreateEpic} className="mb-4 flex gap-2">
                <input
                  name="epic-title"
                  placeholder="Add epic"
                  className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Add
                </button>
              </form>
              <div className="space-y-3">
                {epics.map((epic) => (
                  <div
                    key={epic.id}
                    className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 grid-cols-1 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_auto_auto]"
                  >
                    <input
                      value={epic.name}
                      readOnly
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                    />
                    <input
                      type="date"
                      value={epic.start}
                      readOnly
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                    />
                    <input
                      type="date"
                      value={epic.end}
                      readOnly
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                    />
                    <select
                      value={epic.status}
                      disabled
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                    >
                      <option value="Planned">Planned</option>
                      <option value="On track">On track</option>
                      <option value="At risk">At risk</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setDetailsEpic(epic)}
                      className="rounded border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700"
                    >
                      View details
                    </button>
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
          </section>
        )}

        {(planningTab === "priority" || planningTab === "backlog") && (
          <section className="grid gap-6 lg:grid-cols-1">
            <div className="space-y-6">
              {planningTab === "priority" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                  <h2 className="mb-4 text-xl font-semibold">Priority stack</h2>
                  <div className="space-y-5">
                    {featureGroups.map(({ epic, features: epicFeatures }) => (
                      <div
                        key={epic.id || "unassigned"}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h3 className="font-semibold text-slate-700">
                            {epic.name}
                          </h3>
                          {epic.id && (
                            <button
                              type="button"
                              onClick={() => setDetailsEpic(epic)}
                              className="rounded border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700"
                            >
                              View details
                            </button>
                          )}
                        </div>
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) =>
                            handleFeatureDragEnd(event, epic.id)
                          }
                        >
                          <SortableContext
                            items={epicFeatures.map((feature) => feature.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-3">
                              {epicFeatures.map((feature) => (
                                <SortableFeatureCard
                                  key={feature.id}
                                  feature={feature}
                                >
                                  <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 md:grid-cols-[1.2fr_1fr_0.9fr_0.9fr_0.9fr]">
                                    <input
                                      value={feature.name}
                                      readOnly
                                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                                    />
                                    <select
                                      value={feature.epicId}
                                      disabled
                                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                                    >
                                      <option value="">Unassigned</option>
                                      {epics.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.name}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="date"
                                      value={feature.start}
                                      readOnly
                                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                                    />
                                    <input
                                      type="date"
                                      value={feature.end}
                                      readOnly
                                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                                    />
                                    <select
                                      value={
                                        programIncrements.find(
                                          (pi) => pi.name === feature.pi,
                                        )?.id ?? ""
                                      }
                                      disabled
                                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                                    >
                                      <option value="">
                                        Program increment
                                      </option>
                                      {programIncrements.map((pi) => (
                                        <option key={pi.id} value={pi.id}>
                                          {pi.name}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      value={feature.status}
                                      disabled
                                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                                    >
                                      <option value="Planned">Planned</option>
                                      <option value="Committed">
                                        Committed
                                      </option>
                                      <option value="In progress">
                                        In progress
                                      </option>
                                      <option value="Blocked">Blocked</option>
                                      <option value="Completed">
                                        Completed
                                      </option>
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => setDetailsFeature(feature)}
                                      className="rounded border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700"
                                    >
                                      View details
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteFeature(feature.id)
                                      }
                                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </SortableFeatureCard>
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {planningTab === "backlog" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                  <h2 className="mb-4 text-xl font-semibold">Backlog</h2>
                  <form
                    onSubmit={handleCreateBacklog}
                    className="mb-4 flex gap-2"
                  >
                    <input
                      value={backlogForm.title}
                      onChange={(event) =>
                        setBacklogForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Add backlog item"
                      className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                    <input
                      list="backlog-epics"
                      value={backlogForm.epicName}
                      onChange={(event) =>
                        setBacklogForm((current) => ({
                          ...current,
                          epicName: event.target.value,
                        }))
                      }
                      placeholder="Search epic"
                      className="w-44 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                    <datalist id="backlog-epics">
                      {epics.map((epic) => (
                        <option key={epic.id} value={epic.name} />
                      ))}
                    </datalist>
                    <select
                      value={backlogForm.status}
                      onChange={(event) =>
                        setBacklogForm((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    >
                      <option value="New">New</option>
                      <option value="Ready">Ready</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Add
                    </button>
                  </form>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleBacklogDragEnd}
                  >
                    <SortableContext
                      items={backlog.map((item) => item.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="space-y-3">
                        {backlog.map((item) => (
                          <div key={item.id} className="space-y-2">
                            <SortableBacklogCard item={item} />
                            <div className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                              <input
                                value={item.name}
                                readOnly
                                className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                              />
                              <select
                                value={item.status}
                                disabled
                                className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                              >
                                <option value="New">New</option>
                                <option value="Ready">Ready</option>
                              </select>
                              <input
                                list="backlog-epics"
                                value={item.epicName}
                                readOnly
                                placeholder="Search epic"
                                className="w-40 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                              />
                              {item.epicId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const epic = epics.find(
                                      (candidate) =>
                                        candidate.id === item.epicId,
                                    );
                                    if (epic) setDetailsEpic(epic);
                                  }}
                                  className="rounded border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700"
                                >
                                  View epic
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteBacklog(item.id)}
                                className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SortableContext>

                    <div className="hidden" aria-hidden="true">
                      {detailsEpic && (
                        <div
                          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
                          role="presentation"
                          onMouseDown={() => setDetailsEpic(null)}
                        >
                          <section
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="dashboard-epic-details"
                            className="w-full max-w-[900px] rounded-lg bg-white p-6 shadow-xl"
                            onMouseDown={(event) => event.stopPropagation()}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Epic details
                                </p>
                                <h2
                                  id="dashboard-epic-details"
                                  className="mt-1 text-xl font-semibold"
                                >
                                  {detailsEpic.name}
                                </h2>
                              </div>
                              <button
                                type="button"
                                onClick={() => setDetailsEpic(null)}
                                aria-label="Close epic details"
                                className="rounded p-1 text-xl leading-none text-slate-500 hover:bg-slate-100"
                              >
                                x
                              </button>
                            </div>
                            <div className="mt-5 grid gap-4">
                              <label className="grid gap-1 text-sm font-medium text-slate-700">
                                Status
                                <select
                                  value={detailsEpic.status}
                                  onChange={(event) => {
                                    const epic = {
                                      ...detailsEpic,
                                      status: event.target.value,
                                    };
                                    setDetailsEpic(epic);
                                    handleUpdateEpic(epic.id, epic);
                                  }}
                                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                                >
                                  <option>Planned</option>
                                  <option>On track</option>
                                  <option>At risk</option>
                                  <option>Completed</option>
                                </select>
                              </label>
                              <label className="grid gap-1 text-sm font-medium text-slate-700">
                                Description
                                <textarea
                                  value={detailsEpic.description}
                                  onChange={(event) =>
                                    setDetailsEpic({
                                      ...detailsEpic,
                                      description: event.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="grid gap-1 text-sm font-medium text-slate-700">
                                Acceptance criteria
                                <textarea
                                  value={detailsEpic.acceptanceCriteria}
                                  onChange={(event) =>
                                    setDetailsEpic({
                                      ...detailsEpic,
                                      acceptanceCriteria: event.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="grid gap-1 text-sm font-medium text-slate-700">
                                Notes
                                <textarea
                                  value={detailsEpic.notes}
                                  onChange={(event) =>
                                    setDetailsEpic({
                                      ...detailsEpic,
                                      notes: event.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                                />
                              </label>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateEpic(
                                      detailsEpic.id,
                                      detailsEpic,
                                    )
                                  }
                                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                                >
                                  Save details
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
                            aria-labelledby="dashboard-feature-details"
                            className="w-full max-w-[900px] rounded-lg bg-white p-6 shadow-xl"
                            onMouseDown={(event) => event.stopPropagation()}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Feature details
                                </p>
                                <h2
                                  id="dashboard-feature-details"
                                  className="mt-1 text-xl font-semibold"
                                >
                                  {detailsFeature.name}
                                </h2>
                              </div>
                              <button
                                type="button"
                                onClick={() => setDetailsFeature(null)}
                                aria-label="Close feature details"
                                className="rounded p-1 text-xl leading-none text-slate-500 hover:bg-slate-100"
                              >
                                x
                              </button>
                            </div>
                            <div className="mt-5 grid gap-4">
                              <label className="grid gap-1 text-sm font-medium text-slate-700">
                                Status
                                <select
                                  value={detailsFeature.status}
                                  onChange={(event) => {
                                    const feature = {
                                      ...detailsFeature,
                                      status: event.target.value,
                                    };
                                    setDetailsFeature(feature);
                                    handleUpdateFeature(feature.id, feature);
                                  }}
                                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                                >
                                  <option>Planned</option>
                                  <option>Committed</option>
                                  <option>In progress</option>
                                  <option>Blocked</option>
                                  <option>Completed</option>
                                </select>
                              </label>
                              <label className="grid gap-1 text-sm font-medium text-slate-700">
                                Description
                                <textarea
                                  value={detailsFeature.description}
                                  onChange={(event) =>
                                    setDetailsFeature({
                                      ...detailsFeature,
                                      description: event.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="grid gap-1 text-sm font-medium text-slate-700">
                                Acceptance criteria
                                <textarea
                                  value={detailsFeature.acceptanceCriteria}
                                  onChange={(event) =>
                                    setDetailsFeature({
                                      ...detailsFeature,
                                      acceptanceCriteria: event.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                                />
                              </label>
                              <label className="grid gap-1 text-sm font-medium text-slate-700">
                                Notes
                                <textarea
                                  value={detailsFeature.notes}
                                  onChange={(event) =>
                                    setDetailsFeature({
                                      ...detailsFeature,
                                      notes: event.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
                                />
                              </label>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateFeature(
                                      detailsFeature.id,
                                      detailsFeature,
                                    )
                                  }
                                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                                >
                                  Save details
                                </button>
                              </div>
                            </div>
                          </section>
                        </div>
                      )}
                    </div>
                  </DndContext>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {detailsEpic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={() => setDetailsEpic(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-epic-details"
            className="w-full max-w-[900px] rounded-lg bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <DetailDateFields
              start={detailsEpic.start}
              end={detailsEpic.end}
              onStartChange={(start) =>
                setDetailsEpic({ ...detailsEpic, start })
              }
              onEndChange={(end) => setDetailsEpic({ ...detailsEpic, end })}
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Epic details
                </p>
                <h2
                  id="dashboard-epic-details"
                  className="mt-1 text-xl font-semibold"
                >
                  {detailsEpic.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailsEpic(null)}
                aria-label="Close epic details"
                className="rounded p-1 text-xl leading-none text-slate-500 hover:bg-slate-100"
              >
                x
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Status
                <select
                  value={detailsEpic.status}
                  onChange={(event) => {
                    const epic = { ...detailsEpic, status: event.target.value };
                    setDetailsEpic(epic);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                >
                  <option>Planned</option>
                  <option>On track</option>
                  <option>At risk</option>
                  <option>Completed</option>
                </select>
              </label>
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
            aria-labelledby="dashboard-feature-details"
            className="w-full max-w-[900px] rounded-lg bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <DetailDateFields
              start={detailsFeature.start}
              end={detailsFeature.end}
              onStartChange={(start) =>
                setDetailsFeature({ ...detailsFeature, start })
              }
              onEndChange={(end) =>
                setDetailsFeature({ ...detailsFeature, end })
              }
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Feature details
                </p>
                <h2
                  id="dashboard-feature-details"
                  className="mt-1 text-xl font-semibold"
                >
                  {detailsFeature.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailsFeature(null)}
                aria-label="Close feature details"
                className="rounded p-1 text-xl leading-none text-slate-500 hover:bg-slate-100"
              >
                x
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Status
                <select
                  value={detailsFeature.status}
                  onChange={(event) => {
                    const feature = {
                      ...detailsFeature,
                      status: event.target.value,
                    };
                    setDetailsFeature(feature);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                >
                  <option>Planned</option>
                  <option>Committed</option>
                  <option>In progress</option>
                  <option>Blocked</option>
                  <option>Completed</option>
                </select>
              </label>
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
          </section>
        </div>
      )}
      <Toasts messages={toastMessages} onDismiss={(id) => setToastMessages((current) => current.filter((message) => message.id !== id))} />
    </main>
  );
}
