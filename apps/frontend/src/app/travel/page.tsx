"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { savePlan } from "@/lib/travel/state";
import type { TripPlan } from "@/lib/travel/types";

const PRESETS = [
  {
    label: "Family Fun Trip",
    prompt:
      "Plan a 5-day family trip with two kids (ages 7 and 10) who love theme parks and hands-on museums. Mid-range budget.",
    accent: "text-pink-500",
  },
  {
    label: "Ladies Getaway",
    prompt:
      "Plan a long-weekend girls' trip with spa, rooftop bars, boutique shopping, and one cultural half-day. Stylish neighborhoods only.",
    accent: "text-purple-500",
  },
  {
    label: "Honeymoon Trip",
    prompt:
      "Plan a 7-day honeymoon that balances beach days, a couple of fine-dining nights, and one scenic day-trip. Romantic, unhurried.",
    accent: "text-rose-500",
  },
  {
    label: "Business Trip",
    prompt:
      "Plan a 3-day business trip with well-located hotel near the conference center, two solid dinner spots for client entertainment, and one early-morning walk/run.",
    accent: "text-slate-500",
  },
];

export default function TravelSplashPage() {
  const router = useRouter();
  const [value, setValue] = useState(
    "I will be running the Mount Fuji Marathon (at Kawaguchiko). I plan to stay on additional 5 days. I already have my flights planned.",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(prompt: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/travel/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Generate failed (${res.status}): ${body}`);
      }
      const data = (await res.json()) as TripPlan;
      savePlan(data);
      router.push("/travel/plan");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <header className="mb-10">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-accent">
          Generative Travel Planner
        </p>
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
          Where are we going?
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
          Describe your trip in a sentence or two — the agent will draft an
          itinerary you can steer from there. Pick a preset to see the vibe.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            disabled={loading}
            onClick={() => setValue(p.prompt)}
            className="group rounded-xl border bg-card px-4 py-3 text-left text-sm transition-colors hover:border-accent hover:bg-muted/40 disabled:opacity-50"
          >
            <span
              className={`mb-1 block text-xs font-medium uppercase tracking-wider ${p.accent}`}
            >
              Preset
            </span>
            <span className="block font-medium">{p.label}</span>
          </button>
        ))}
      </div>

      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Generative prompt
      </label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={loading}
        rows={5}
        placeholder="e.g. 'Plan a trip with friends to Mount Fuji Marathon in Kawaguchiko and 5 days after the marathon.'"
        className="w-full resize-none rounded-xl border bg-card px-4 py-3 text-base shadow-sm outline-none transition-colors focus:border-accent disabled:opacity-50"
      />

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={loading || value.trim().length < 10}
        onClick={() => submit(value)}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Designing your theme…
          </>
        ) : (
          "Let's gooooo"
        )}
      </button>
    </main>
  );
}
