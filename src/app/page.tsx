"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { PaddleSession } from "@/lib/types";
import { loadSessions, saveSessions } from "@/lib/storage";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
});
const SessionsMap = dynamic(() => import("@/components/SessionsMap"), {
  ssr: false,
});

export default function Home() {
  const [sessions, setSessions] = useState<PaddleSession[]>([]);
  const [lakeName, setLakeName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  function resetForm() {
    setLakeName("");
    setDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setLocation(null);
    setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lakeName.trim()) return;

    const next = editingId
      ? sessions.map((s) =>
          s.id === editingId
            ? {
                ...s,
                lakeName: lakeName.trim(),
                date,
                notes: notes.trim(),
                lat: location?.lat,
                lng: location?.lng,
              }
            : s
        )
      : [
          {
            id: crypto.randomUUID(),
            lakeName: lakeName.trim(),
            date,
            notes: notes.trim(),
            lat: location?.lat,
            lng: location?.lng,
          },
          ...sessions,
        ];

    setSessions(next);
    saveSessions(next);
    resetForm();
  }

  function handleEdit(s: PaddleSession) {
    setEditingId(s.id);
    setLakeName(s.lakeName);
    setDate(s.date);
    setNotes(s.notes);
    setLocation(s.lat != null && s.lng != null ? { lat: s.lat, lng: s.lng } : null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id: string) {
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    saveSessions(next);
    if (editingId === id) resetForm();
  }

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-16">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          PaddleLog
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900"
        >
          {editingId && (
            <div className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Editing entry
              <button
                type="button"
                onClick={resetForm}
                className="text-amber-700 underline hover:no-underline dark:text-amber-300"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="lakeName" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Lake
            </label>
            <input
              id="lakeName"
              type="text"
              value={lakeName}
              onChange={(e) => setLakeName(e.target.value)}
              placeholder="e.g. Lake Tahoe"
              required
              className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-black outline-none focus:border-black/30 dark:border-white/10 dark:text-zinc-50 dark:focus:border-white/30"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="date" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-black outline-none focus:border-black/30 dark:border-white/10 dark:text-zinc-50 dark:focus:border-white/30"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Location
              </label>
              <span className="text-xs text-zinc-400">
                {location
                  ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                  : "Click the map to drop a pin (optional)"}
              </span>
            </div>
            <LocationPicker
              key={editingId ?? "new"}
              value={location}
              onChange={setLocation}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="notes" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was it?"
              rows={3}
              className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-black outline-none focus:border-black/30 dark:border-white/10 dark:text-zinc-50 dark:focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            {editingId ? "Save changes" : "Log paddle"}
          </button>
        </form>

        {sorted.some((s) => s.lat != null && s.lng != null) && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Where I&apos;ve paddled
            </h2>
            <SessionsMap sessions={sorted} />
          </div>
        )}

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {sorted.length === 0 ? "No paddles logged yet" : `${sorted.length} paddle${sorted.length === 1 ? "" : "s"} logged`}
          </h2>

          {sorted.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-black dark:text-zinc-50">{s.lakeName}</span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{s.date}</span>
                  {s.lat != null && s.lng != null && (
                    <span className="text-sm text-zinc-400" title="Location pinned">
                      📍
                    </span>
                  )}
                </div>
                {s.notes && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{s.notes}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-3">
                <button
                  onClick={() => handleEdit(s)}
                  className="text-sm text-zinc-400 hover:text-black dark:hover:text-zinc-50"
                  aria-label={`Edit ${s.lakeName} entry`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-sm text-zinc-400 hover:text-red-500"
                  aria-label={`Delete ${s.lakeName} entry`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
