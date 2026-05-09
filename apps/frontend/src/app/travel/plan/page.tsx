"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  CopilotChatConfigurationProvider,
  CopilotSidebar,
  useAgentContext,
  useFrontendTool,
} from "@copilotkit/react-core/v2";

import { clearPlan, loadPlan, savePlan } from "@/lib/travel/state";
import {
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  CORE_CATEGORIES,
  type DecisionCategory,
  type DecisionItem,
  type SuggestionTile,
  type TripPlan,
} from "@/lib/travel/types";

type Tab = "suggestions" | "itinerary";

function categoryLabel(c: DecisionCategory) {
  return CATEGORY_LABELS[c];
}

export default function TravelPlanPage() {
  return (
    <CopilotChatConfigurationProvider agentId="default">
      <TravelPlanInner />
    </CopilotChatConfigurationProvider>
  );
}

function TravelPlanInner() {
  const router = useRouter();
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [instruction, setInstruction] = useState("");
  const [steering, setSteering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("suggestions");

  // Tools close over state via a ref — `useFrontendTool` registers once
  // (like `useEffect`) and invoking a stale closure after a plan update would
  // replace the latest state with an older snapshot.
  const planRef = useRef<TripPlan | null>(null);
  planRef.current = plan;

  useEffect(() => {
    const saved = loadPlan();
    if (!saved) {
      router.replace("/travel");
      return;
    }
    setPlan(saved);
  }, [router]);

  const themeVars = useMemo(() => {
    if (!plan) return undefined;
    return {
      ["--theme-accent" as string]: plan.theme.accent,
      ["--theme-bg" as string]: plan.theme.background,
    } as React.CSSProperties;
  }, [plan]);

  const decisionsByCategory = useMemo(() => {
    if (!plan) return {} as Record<DecisionCategory, DecisionItem[]>;
    return plan.decisions.reduce<Record<string, DecisionItem[]>>((acc, d) => {
      (acc[d.category] ??= []).push(d);
      return acc;
    }, {});
  }, [plan]);

  const suggestionsByCategory = useMemo(() => {
    if (!plan) return {} as Record<DecisionCategory, SuggestionTile[]>;
    return plan.suggestions.reduce<Record<string, SuggestionTile[]>>(
      (acc, s) => {
        (acc[s.category] ??= []).push(s);
        return acc;
      },
      {},
    );
  }, [plan]);

  // Always POST the latest plan — never close over stale `plan` state.
  async function steer(text: string, basePlan?: TripPlan) {
    const current = basePlan ?? planRef.current;
    if (!current || !text.trim()) return;
    setSteering(true);
    setError(null);
    try {
      const res = await fetch("/api/travel/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "steer",
          plan: current,
          instruction: text,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Steering failed (${res.status}): ${body}`);
      }
      const updated = (await res.json()) as TripPlan;
      planRef.current = updated;
      setPlan(updated);
      savePlan(updated);
      setInstruction("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSteering(false);
    }
  }

  function bookSuggestion(s: SuggestionTile) {
    const current = planRef.current;
    if (!current) return;
    const next: TripPlan = {
      ...current,
      decisions: [
        ...current.decisions,
        {
          id: s.id,
          category: s.category,
          title: s.title,
          summary: s.description,
          status: "booked",
        },
      ],
      suggestions: current.suggestions.filter((x) => x.id !== s.id),
    };
    planRef.current = next;
    setPlan(next);
    savePlan(next);
    void steer(
      `The user just booked "${s.title}" (${s.category}). Update the itinerary to reflect this. Don't add it back to suggestions.`,
      next,
    );
  }

  function kickOut(d: DecisionItem) {
    void steer(
      `Kick out "${d.title}" from the ${d.category} decisions — the user doesn't want this. Replace it with a fresh suggestion tile that fits the trip vibe better, and update the itinerary.`,
    );
  }

  function removeSuggestion(s: SuggestionTile) {
    const current = planRef.current;
    if (!current) return;
    const next: TripPlan = {
      ...current,
      suggestions: current.suggestions.filter((x) => x.id !== s.id),
    };
    planRef.current = next;
    setPlan(next);
    savePlan(next);
  }

  function requestForCategory(cat: DecisionCategory) {
    void steer(
      `The user needs ${CATEGORY_LABELS[cat].toLowerCase()} options. Generate 2-3 suggestion tiles for the "${cat}" category that fit the trip vibe. Don't touch other decisions.`,
    );
  }

  function regenerateItinerary() {
    void steer(
      "Regenerate the itinerary from scratch. Use the currently booked decisions as anchors and fill the rest with well-paced activities that match the trip vibe. Keep the theme and decisions unchanged.",
    );
  }

  function startOver() {
    clearPlan();
    router.push("/travel");
  }

  // Share the current trip plan with the agent. Re-registers on any change.
  useAgentContext({
    description:
      "Current TripPlan — booked decisions (rail), remaining suggestions (tiles), day-by-day itinerary, and theme. Use tool ids from this context when calling frontend tools.",
    value: plan
      ? {
          destination: plan.destination,
          theme: plan.theme,
          decisions: plan.decisions.map((d) => ({
            id: d.id,
            category: d.category,
            title: d.title,
            summary: d.summary,
          })),
          suggestions: plan.suggestions.map((s) => ({
            id: s.id,
            category: s.category,
            title: s.title,
            description: s.description,
          })),
          itinerary: (plan.itinerary ?? []).map((d) => ({
            day: d.day,
            label: d.label,
            date: d.date,
            items: d.items.map((it) => ({
              time: it.time,
              title: it.title,
              category: it.category,
            })),
          })),
        }
      : null,
  });

  useFrontendTool({
    name: "bookSuggestion",
    description:
      "Move a suggestion tile into the booked decisions rail. Use the exact id from the shared TripPlan context.",
    parameters: z.object({
      suggestionId: z.string().describe("Id of the suggestion to book"),
    }),
    handler: async ({ suggestionId }) => {
      const current = planRef.current;
      if (!current) return { ok: false, error: "no plan loaded" };
      const s = current.suggestions.find((x) => x.id === suggestionId);
      if (!s) return { ok: false, error: `no suggestion with id ${suggestionId}` };
      bookSuggestion(s);
      return { ok: true, booked: s.title };
    },
  });

  useFrontendTool({
    name: "kickOutDecision",
    description:
      "Remove a booked item from the decisions rail and ask the backend to offer a replacement for that category.",
    parameters: z.object({
      decisionId: z.string().describe("Id of the booked decision to remove"),
    }),
    handler: async ({ decisionId }) => {
      const current = planRef.current;
      if (!current) return { ok: false, error: "no plan loaded" };
      const d = current.decisions.find((x) => x.id === decisionId);
      if (!d) return { ok: false, error: `no decision with id ${decisionId}` };
      kickOut(d);
      return { ok: true, kicked: d.title, category: d.category };
    },
  });

  useFrontendTool({
    name: "suggestForCategory",
    description:
      "Generate 2-3 new suggestion tiles for a specific category. Use when the user asks for more options of a given type.",
    parameters: z.object({
      category: z.enum([
        "flight",
        "transportation",
        "accommodation",
        "attraction",
        "food",
        "other",
      ]),
    }),
    handler: async ({ category }) => {
      requestForCategory(category as DecisionCategory);
      return { ok: true, requested: category };
    },
  });

  useFrontendTool({
    name: "regenerateItinerary",
    description:
      "Rebuild the day-by-day itinerary from scratch using the currently booked decisions as anchors.",
    parameters: z.object({}),
    handler: async () => {
      regenerateItinerary();
      return { ok: true };
    },
  });

  useFrontendTool({
    name: "steerPlan",
    description:
      "Free-form refinement — apply any natural-language instruction to the current plan (swap items, re-theme, multi-step tweaks). Use this when the more specific tools don't fit.",
    parameters: z.object({
      instruction: z
        .string()
        .describe("Full, concrete instruction to apply to the current plan."),
    }),
    handler: async ({ instruction }) => {
      await steer(instruction);
      return { ok: true };
    },
  });

  if (!plan) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main style={themeVars} className="flex min-h-screen flex-col">
      <header className="border-b" style={{ background: plan.theme.background }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={startOver}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={14} /> Start over
            </button>
            <span
              className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider"
              style={{
                color: plan.theme.accent,
                background: `${plan.theme.accent}15`,
              }}
            >
              {plan.theme.name}
            </span>
          </div>

          <div>
            <h1 className="flex items-center gap-3 text-3xl font-semibold leading-tight md:text-4xl">
              <span>{plan.theme.emoji}</span>
              <span>{plan.theme.headline}</span>
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
              {plan.theme.subhead}
            </p>
          </div>

          <div className="mt-2 flex gap-2">
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !steering) steer(instruction);
              }}
              disabled={steering}
              placeholder='Steer the plan — e.g. "kick out the business hotel, I want a ryokan with onsen"'
              className="flex-1 rounded-xl border bg-card px-4 py-3 text-sm shadow-sm outline-none transition-colors focus:border-[var(--theme-accent)] disabled:opacity-50"
            />
            <button
              onClick={() => steer(instruction)}
              disabled={steering || !instruction.trim()}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: plan.theme.accent }}
            >
              {steering ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {steering ? "Thinking…" : "Steer"}
            </button>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6 lg:flex-row">
        <section className="flex-1">
          <div className="mb-3 flex items-center gap-1 rounded-xl border bg-card p-1 w-fit">
            <TabButton
              active={tab === "suggestions"}
              onClick={() => setTab("suggestions")}
              accent={plan.theme.accent}
            >
              Suggestions · {plan.suggestions.length}
            </TabButton>
            <TabButton
              active={tab === "itinerary"}
              onClick={() => setTab("itinerary")}
              accent={plan.theme.accent}
            >
              Itinerary · {plan.itinerary?.length ?? 0} days
            </TabButton>
          </div>

          {tab === "suggestions" ? (
            <SuggestionsView
              plan={plan}
              suggestionsByCategory={suggestionsByCategory}
              onBook={bookSuggestion}
              onDismiss={removeSuggestion}
              onRequestCategory={requestForCategory}
              disabled={steering}
            />
          ) : (
            <ItineraryView
              plan={plan}
              onRegenerate={regenerateItinerary}
              disabled={steering}
            />
          )}
        </section>

        <aside className="w-full shrink-0 lg:w-96">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your itinerary</h2>
            <span className="text-xs text-muted-foreground">
              {plan.decisions.length} booked
            </span>
          </div>

          <div className="space-y-3">
            {CORE_CATEGORIES.map((cat) => (
              <CategorySlot
                key={cat}
                category={cat}
                accent={plan.theme.accent}
                items={decisionsByCategory[cat] ?? []}
                onKickOut={kickOut}
                onRequest={() => requestForCategory(cat)}
                disabled={steering}
              />
            ))}

            {decisionsByCategory.food?.length ? (
              <CategorySlot
                category="food"
                accent={plan.theme.accent}
                items={decisionsByCategory.food}
                onKickOut={kickOut}
                onRequest={() => requestForCategory("food")}
                disabled={steering}
              />
            ) : null}
            {decisionsByCategory.other?.length ? (
              <CategorySlot
                category="other"
                accent={plan.theme.accent}
                items={decisionsByCategory.other}
                onKickOut={kickOut}
                onRequest={() => requestForCategory("other")}
                disabled={steering}
              />
            ) : null}
          </div>
        </aside>
      </div>

      <CopilotSidebar
        labels={{
          chatTitle: plan.theme.name,
          chatDescription: "Ask me to steer your trip — book, kick out, or add options.",
          initial: `Hi! I can help you plan "${plan.destination}". Try: "book the lakeside ryokan", "kick out the business hotel", or "give me more onsen options."`,
        }}
      />
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
      style={{
        color: active ? "white" : undefined,
        background: active ? accent : undefined,
      }}
    >
      {children}
    </button>
  );
}

function SuggestionsView({
  plan,
  suggestionsByCategory,
  onBook,
  onDismiss,
  onRequestCategory,
  disabled,
}: {
  plan: TripPlan;
  suggestionsByCategory: Record<string, SuggestionTile[]>;
  onBook: (s: SuggestionTile) => void;
  onDismiss: (s: SuggestionTile) => void;
  onRequestCategory: (c: DecisionCategory) => void;
  disabled: boolean;
}) {
  const categoriesInUse = Array.from(
    new Set<DecisionCategory>([
      ...CORE_CATEGORIES,
      ...(Object.keys(suggestionsByCategory) as DecisionCategory[]),
    ]),
  );

  if (!plan.suggestions.length) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        All caught up. Use the steer bar above to ask for more ideas.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categoriesInUse.map((cat) => {
        const items = suggestionsByCategory[cat] ?? [];
        if (!items.length) return null;
        return (
          <div key={cat}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <span>{CATEGORY_EMOJI[cat]}</span>
                <span>{CATEGORY_LABELS[cat]}</span>
              </h3>
              <button
                onClick={() => onRequestCategory(cat)}
                disabled={disabled}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-[var(--theme-accent)] disabled:opacity-50"
              >
                <Sparkles size={12} /> More like this
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((s) => (
                <article
                  key={s.id}
                  className="group relative flex flex-col rounded-xl border bg-card p-4 transition-colors hover:border-[var(--theme-accent)]"
                >
                  <button
                    onClick={() => onDismiss(s)}
                    className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>

                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl leading-none">{s.emoji}</span>
                  </div>

                  <h4 className="text-base font-semibold">{s.title}</h4>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>

                  <button
                    onClick={() => onBook(s)}
                    disabled={disabled}
                    className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] disabled:opacity-50"
                  >
                    <Check size={14} /> Add to plan
                  </button>
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ItineraryView({
  plan,
  onRegenerate,
  disabled,
}: {
  plan: TripPlan;
  onRegenerate: () => void;
  disabled: boolean;
}) {
  const days = plan.itinerary ?? [];

  if (!days.length) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No itinerary yet. Ask the agent to build one.
        </p>
        <button
          onClick={onRegenerate}
          disabled={disabled}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] disabled:opacity-50"
        >
          <Sparkles size={14} /> Generate itinerary
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={onRegenerate}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-[var(--theme-accent)] disabled:opacity-50"
        >
          <RefreshCw size={12} /> Regenerate itinerary
        </button>
      </div>

      <ol className="space-y-4">
        {days.map((d) => (
          <li key={d.day} className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-base font-semibold">
                <span
                  className="mr-2 text-xs font-medium uppercase tracking-wider"
                  style={{ color: plan.theme.accent }}
                >
                  Day {d.day}
                </span>
                {d.label}
              </h3>
              {d.date && (
                <span className="text-xs text-muted-foreground">{d.date}</span>
              )}
            </div>

            <ul className="space-y-2">
              {d.items.map((it, idx) => (
                <li
                  key={`${d.day}-${idx}`}
                  className="flex items-start gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-muted/40"
                >
                  <span className="mt-0.5 w-16 shrink-0 text-xs font-medium text-muted-foreground">
                    {it.time ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={10} /> {it.time}
                      </span>
                    ) : (
                      "—"
                    )}
                  </span>
                  <span
                    className="mt-0.5 text-sm leading-none"
                    aria-hidden
                  >
                    {CATEGORY_EMOJI[it.category] ?? "•"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{it.title}</p>
                    {it.detail && (
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {it.detail}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

function CategorySlot({
  category,
  items,
  accent,
  onKickOut,
  onRequest,
  disabled,
}: {
  category: DecisionCategory;
  items: DecisionItem[];
  accent: string;
  onKickOut: (d: DecisionItem) => void;
  onRequest: () => void;
  disabled: boolean;
}) {
  const hasItems = items.length > 0;
  return (
    <section className="rounded-xl border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>{CATEGORY_EMOJI[category]}</span>
          <span>{CATEGORY_LABELS[category]}</span>
        </h3>
        {hasItems && (
          <span className="text-[10px] font-medium text-muted-foreground">
            {items.length} booked
          </span>
        )}
      </div>

      {hasItems ? (
        <ul className="space-y-2">
          {items.map((d) => (
            <li
              key={d.id}
              className="group rounded-lg border bg-background p-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                      <Check size={10} /> booked
                    </span>
                  </div>
                  <h4 className="mt-1 text-sm font-semibold">{d.title}</h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {d.summary}
                  </p>
                </div>
                <button
                  onClick={() => onKickOut(d)}
                  disabled={disabled}
                  className="rounded-md px-2 py-1 text-[10px] font-medium text-red-500 opacity-0 transition-opacity hover:bg-red-500/10 group-hover:opacity-100 disabled:opacity-50"
                  title="Kick out"
                >
                  Kick out
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <button
          onClick={onRequest}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-3 text-xs text-muted-foreground transition-colors hover:border-[color:var(--theme-accent)] hover:text-[var(--theme-accent)] disabled:opacity-50"
          style={{ ["--theme-accent" as string]: accent } as React.CSSProperties}
        >
          <Sparkles size={12} /> Ask agent to suggest
        </button>
      )}
    </section>
  );
}
