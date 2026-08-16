"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

type SavedRoadmap = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  savedAt: string;
};

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<SavedRoadmap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/roadmap')
      .then((response) => response.json())
      .then((data) => setRoadmaps(data.savedRoadmaps ?? []))
      .catch((error) => console.error('Failed to load saved roadmaps', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 md:p-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-soft">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Program Portfolio</p>
            <h1 className="mt-2 text-3xl font-bold">Saved roadmaps</h1>
            <p className="mt-2 text-sm text-slate-600">Select a saved roadmap to continue planning or view its timeline.</p>
          </div>
          <Link href="/" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">Back to portfolio</Link>
        </header>

        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-slate-600 shadow-soft">Loading saved roadmaps...</div>
        ) : roadmaps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-soft">
            <h2 className="text-xl font-semibold">No saved roadmaps yet</h2>
            <p className="mt-2 text-sm text-slate-600">Save the current roadmap from Program Portfolio to make it available here.</p>
            <Link href="/" className="mt-5 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Open portfolio</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {roadmaps.map((roadmap) => (
              <article key={roadmap.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                <h2 className="text-xl font-semibold">{roadmap.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{roadmap.startDate} to {roadmap.endDate}</p>
                <p className="mt-1 text-xs text-slate-500">Saved {new Date(roadmap.savedAt).toLocaleString()}</p>
                <div className="mt-5 flex gap-2">
                  <Link href="/" className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white">Open roadmap</Link>
                  <Link href="/chart" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">View chart</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
