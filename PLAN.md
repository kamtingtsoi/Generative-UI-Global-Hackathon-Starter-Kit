# Project Plan
> **AI Instruction:** Treat this file as the absolute source of truth for the project's state. When asked what we are building or what the next steps are, refer to this document.

## Vision Statement
Build a generative travel planning experience that turns a user's trip intent into a structured, editable itinerary instead of a static search-and-book flow. A traveler types (or picks a template like "Mount Fuji Marathon with friends") and the agent streams an opinionated plan — flight, accommodation, attractions, map — into a canvas they can steer with a right-side preference rail and per-card "kick out" feedback. The core value is proactive trip drafting with interactive refinement, powered by CopilotKit's canvas pattern, a LangChain Deep Agent, and Gemini-rendered A2UI components.

## Scope & Constraints

**Hackathon deadline: ~2 hours. Single golden demo path. Everything else deferred.**

- **In scope (MVP, demo-critical):**
  - Splash screen with free-text prompt + 4 seeded trip templates (Family Fun, Ladies Getaway, Honeymoon, Business — plus the demo prompt).
  - Generate a single `TripPlan` with one Flight, one Accommodation, 2–4 Attractions from **mocked** travel data.
  - Itinerary cards that stream into a canvas (reusing the leads-canvas layout).
  - Right-rail "Steering Preferences" chip list that the agent reads on the next generation (scoped per-thread, no auth/profile).
  - Per-card "kick out" action → agent regenerates *just that slot* using updated preferences.
  - Static map placeholder with pins.
  - One seeded demo prompt that tells a complete story end-to-end.

- **Deferred (explicitly cut for time, not rejected):**
  - Real auth / user profile / cross-thread preference memory.
  - Real travel APIs (flights, hotels, Google Places).
  - Interactive map / route drawing.
  - Paste-existing-flight parser.
  - Booking, payment, inventory.
  - Tests, CI, observability, error-handling polish.
  - Multi-trip workflows.

- **Constraints:**
  - Reuse the starter kit maximally — CopilotKit runtime, persistent threads, Deep Agent in `apps/agent/`, A2UI renderer, `/leads` canvas pattern.
  - Mocked fixture data only — no external API keys beyond the Gemini key the starter already needs.
  - Keep the demo reliably reproducible; favor determinism over breadth.

## System Architecture

### Core Entity
`TripPlan` — per-thread JSON object:
```ts
{
  destination: string;
  purpose: string;           // drives theme: "marathon", "leisure", "business", ...
  dates: { start: string; end: string };
  preferences: string[];     // e.g. ["Rest & Relax", "Outdoor"] — steers regeneration
  flight: FlightCard | null;
  accommodation: StayCard | null;
  attractions: AttractionCard[];
  mapPins: { lat: number; lng: number; label: string }[];
}
```

### Reuse (don't touch)
- CopilotKit runtime + persistent threads (Postgres-backed) — already wired.
- Deep Agent harness in `apps/agent/` — keep the `create_deep_agent` scaffold.
- A2UI renderer + canvas shell from `/leads`.
- Splash → canvas navigation pattern.
- `scripts/check-env.sh`, `npm run dev`.

### Replace
- `apps/agent/src/notion_mcp.py` integration → `apps/agent/src/travel_tools.py` exposing `search_flights`, `search_stays`, `search_attractions`, `regenerate_slot` — all returning mocked fixture JSON keyed by destination.
- Lead card components → Flight / Stay / Attraction cards (same shell, new content).
- Leads prompt (`INTEGRATION_PROMPT`) → travel planner prompt with theming instruction.

### New
- `apps/frontend/src/lib/travel/state.ts` — `TripPlan` types + thread-state helpers.
- `apps/frontend/src/lib/travel/fixtures.ts` — mocked flight/stay/attraction data for Kawaguchiko + 2 fallback destinations.
- `apps/frontend/src/components/travel/{FlightCard,StayCard,AttractionCard,PreferenceRail,TripMap}.tsx`.
- `apps/agent/src/travel_tools.py` — mocked tool suite + regenerate-slot tool.
- Updated `/travel` route consuming the above.

### Data Flow
1. User lands on `/travel` splash, picks template or types prompt.
2. Agent parses intent → produces `purpose` + initial `preferences` → calls `search_*` tools.
3. Tools return fixture cards → agent streams them into `TripPlan` state.
4. UI theme (accent color, hero copy) derives from `purpose` ("marathon" → athletic teal; "business" → slate; etc.).
5. User clicks "kick out" on a card → agent appends negative preference → calls `regenerate_slot` → replaces just that card.
6. User toggles a preference chip → next generation / regeneration reads it.

## Roadmap
> `[x]` done · `[/]` in progress · `[ ]` next

### Hour 1 — Scaffold & Agent
- `[ ]` **Blocker #0:** Fix broken `tiles` array in `apps/frontend/src/app/page.tsx` (missing `const tiles = [`).
- `[ ]` Define `TripPlan` types + fixtures in `apps/frontend/src/lib/travel/`.
- `[ ]` Wire `/travel` splash: free-text input + 4 template buttons, reusing leads splash styling.
- `[ ]` Create `apps/agent/src/travel_tools.py` with `search_flights`, `search_stays`, `search_attractions`, `regenerate_slot` returning fixtures.
- `[ ]` Update agent prompt to plan a trip, emit `purpose` + initial `preferences`, call tools, stream cards into state.

### Hour 2 — UI, Kick-out Loop, Demo Polish
- `[ ]` Build `FlightCard`, `StayCard`, `AttractionCard` (clone leads card shell).
- `[ ]` Build `PreferenceRail` (right-side chip list bound to thread state).
- `[ ]` Add purpose-driven theme accent (simple CSS var switch in `/travel` layout).
- `[ ]` Static `TripMap` placeholder with pins from `mapPins`.
- `[ ]` Per-card "kick out" button → agent action → regenerate that slot with updated prefs.
- `[ ]` Smoke-test the demo prompt end-to-end; record a 90s demo clip.

## Current Execution Status
- **Current Task:** Refining plan; about to start scaffolding.
- **Recent accomplishment:** Restored `README.md`; aligned on max-reuse + mocked-data strategy with 2h timebox.
- **Blocked By:** `page.tsx` has a broken `tiles` array — must fix before `/travel` route renders.
- **Next Steps (1–3):**
  1. Fix `page.tsx` tiles bug.
  2. Create `apps/frontend/src/lib/travel/state.ts` + `fixtures.ts` (Kawaguchiko fixture set).
  3. Scaffold `/travel/page.tsx` splash with the 4 templates + prompt input.

## Demo Script (90 seconds)

**Setup:** `/travel` splash is open. Browser in one tab.

1. **(0:00)** Presenter types/pastes the prompt:
   > "Plan a trip with friends to Mount Fuji Marathon in Kawaguchiko and 5 days after the marathon."
2. **(0:10)** Agent parses intent → `/travel` theme shifts to an athletic/outdoor accent based on `purpose: "marathon"`. Hero headline updates ("Kawaguchiko · Mount Fuji Marathon · 6 days with friends").
3. **(0:20)** Flight card streams in (NRT → HND, group-friendly departure). Accommodation card streams in (a polished business hotel near the start line — deliberately off-vibe, to set up the kick-out). Attraction cards stream in (Chureito Pagoda, Oishi Park, Fuji-Q, onsen, ropeway).
4. **(0:45)** Presenter clicks **two attractions** (onsen + ropeway) to mark them as kept — chips appear in the right-rail preferences ("Rest & Relax", "Views").
5. **(0:55)** Presenter clicks **"Kick out"** on the business hotel card. Card dissolves; agent appends negative preference ("not business-style") and the current positive preferences ("Rest & Relax") and calls `regenerate_slot("accommodation")`.
6. **(1:10)** New accommodation streams in: a ryokan or lakeside cabin with onsen — matches the refined preferences.
7. **(1:25)** Presenter pans to the map showing pins for flight arrival, stay, and attractions. Done.

**Single narrative beat:** "The agent didn't just search — it drafted a plan, adapted its theme to the trip's purpose, and let us steer it card-by-card without throwing the whole itinerary away."

## Risks & Assumptions

- **Risks:**
  - **Agent prompt drift** — Gemini may not reliably emit the `purpose` field or call `regenerate_slot` with the right scope. *Mitigation:* keep the tool signatures narrow; seed few-shot examples in the prompt.
  - **Thread-state shape mismatch** between agent writes and UI reads. *Mitigation:* single `TripPlan` type imported by both TS and mirrored in the Python tool schema.
  - **Non-determinism during demo** — mocked tools return fixed data, but Gemini could still free-form. *Mitigation:* the demo prompt maps to a hard-coded fixture set; tools return the same cards every call.
  - **Time overrun on UI polish** — easy to over-invest in card styling. *Mitigation:* reuse leads card shells verbatim; only swap icons + fields.
- **Assumptions:**
  - Users accept a guided card-based flow over open-ended chat.
  - Mocked fixtures are acceptable for a hackathon demo.
  - The starter's canvas + A2UI + threads infrastructure works out-of-the-box once the env check passes.
  - Per-thread preferences (no auth) are sufficient for the demo narrative.

*Note to Human: Update "Current Execution Status" and "Risks & Assumptions" at the end of every programming session. Use `PLAN.md` + `agent_logs/*` + `rules/` to keep agents aligned.*
