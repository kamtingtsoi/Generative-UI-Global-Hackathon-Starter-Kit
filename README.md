# Generative Travel Planner

![Hackathon Banner](apps/frontend/public/banner.jpg)

A hackathon entry for the **Generative UI Global Hackathon: Agentic Interfaces** — a travel planner that turns one sentence of trip intent into a themed, editable itinerary that the user can steer both by clicking and by chatting with an embedded CopilotKit agent.

Fork of the CopilotKit / LangGraph / Gemini / Notion-MCP starter kit. We replaced the leads demo with a travel app, swapped the agent backend to **AWS Bedrock (Claude Haiku 4.5)** via the Vercel AI SDK, and kept the CopilotKit v2 surface (sidebar chat, frontend tools, shared agent context) wired through a single Next.js route.

---

## What it does

1. **Splash screen** (`/travel`) — chat-style prompt with four preset styles (Family Fun, Ladies Getaway, Honeymoon, Business). User writes or picks a prompt and hits **Let's gooooo**.
2. **Theme generation** — the prompt is sent to Bedrock, which returns a full `TripPlan` JSON: a custom UI theme (accent colour, headline, emoji), inferred already-decided items (e.g. "flights already booked"), 6–10 suggestion tiles, and a day-by-day itinerary.
3. **Plan page** (`/travel/plan`) — themed hero, top steering bar, a right-rail showing the four core decision slots (**Flight / Local transportation / Accommodation / Attractions**), a tabbed main area with **Suggestions** (grouped by category) and **Itinerary** (timeline), and a CopilotKit sidebar where the agent can:
   - `bookSuggestion(id)` — move a tile into the rail
   - `kickOutDecision(id)` — remove a booked item and ask for a replacement
   - `suggestForCategory(category)` — generate more options for one slot
   - `regenerateItinerary()` — rebuild the timeline around current bookings
   - `steerPlan(instruction)` — free-form refinement

Every tile, steer action, and kick-out keeps the itinerary in sync by firing a follow-up Bedrock call.

### Demo script

> "Plan a trip with friends to Mount Fuji Marathon in Kawaguchiko and 5 days after the marathon."

- Athletic/volcanic theme auto-applied, "International flights" + "Mount Fuji Marathon" already in the decisions rail.
- User clicks two attractions (onsen, ropeway) — chips go into the rail.
- User kicks out the business hotel from the **Accommodation** slot → lakeside ryokan streams in.
- User types in the sidebar: *"Give me more onsen options"* → agent calls `suggestForCategory("accommodation")` → 2-3 new tiles.
- User: *"Regenerate the itinerary"* → timeline rebuilds around the new bookings.

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) + Turbopack | Starter's existing setup |
| Styling | Tailwind + Radix UI | Starter's existing setup |
| AI chat surface | **CopilotKit v2** (`@copilotkit/react-core/v2`) — `CopilotKitProvider`, `CopilotSidebar`, `CopilotChatConfigurationProvider`, `useAgentContext`, `useFrontendTool` | Generative UI primitives, clean separation between model ↔ UI |
| Runtime | **CopilotKit v2 runtime** (`@copilotkit/runtime/v2`) — `CopilotRuntime` + `BuiltInAgent` with an AI SDK factory, mounted at `/api/copilotkit/[[...slug]]` via `createCopilotRuntimeHandler` | Native Next.js route, no BFF, no LangGraph, no Intelligence gateway |
| Model | **AWS Bedrock — Claude Haiku 4.5** (configurable) | Fast, cheap, strong tool-calling |
| Model SDK | Vercel AI SDK (`ai`) + `@ai-sdk/amazon-bedrock` | Streams straight into `BuiltInAgent({ type: "aisdk" })` |
| Credentials | `@aws-sdk/credential-providers` `fromIni` | Profile name only lives in env — never in code |
| State | Plain `localStorage` (per-browser) | Hackathon-scope, no auth needed |
| Theme data | Generated per-prompt by Bedrock | Accent colour, headline, emoji all AI-chosen |

### The CopilotKit ↔ Bedrock wiring

```ts
// apps/frontend/src/app/api/copilotkit/[[...slug]]/route.ts
const bedrock = createAmazonBedrock({
  region: process.env.AWS_REGION,
  credentialProvider: process.env.AWS_PROFILE
    ? fromIni({ profile: process.env.AWS_PROFILE })
    : undefined,
});

const agent = new BuiltInAgent({
  type: "aisdk",
  factory: ({ input, abortSignal }) =>
    streamText({
      model: bedrock(process.env.BEDROCK_MODEL_ID!),
      system: AGENT_SYSTEM,
      messages: convertMessagesToVercelAISDKMessages(input.messages),
      tools: convertToolDefinitionsToVercelAITools(input.tools ?? []),
      abortSignal,
    }),
});

const handler = createCopilotRuntimeHandler({
  runtime: new CopilotRuntime({ agents: { default: agent } }),
  basePath: "/api/copilotkit",
});

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
```

> `@copilotkit/runtime` transitively imports the v2 express endpoint, which Turbopack can't bundle. The fix is a two-liner in `next.config.ts`: `serverExternalPackages: ["@copilotkit/runtime"]`.

---

## Run it locally

**Requirements**

- Node.js (tested with v26)
- AWS credentials for a profile with Bedrock access to a Claude model (Haiku 4.5 recommended) in a supported region

**1. Set env vars** at `apps/frontend/.env.local`:

```bash
AWS_PROFILE=your-profile-name
AWS_REGION=your-region
BEDROCK_MODEL_ID=your-bedrock-model-id
```

**2. Install and run** (frontend only — we don't use the Python agent, the BFF, the MCP server, or Docker):

```bash
npm install --workspace frontend --ignore-scripts
npm run dev --workspace frontend
```

**3. Open** <http://localhost:3010/travel>.

---

## Project layout (what's new)

```text
apps/frontend/src/
├── app/
│   ├── api/
│   │   ├── copilotkit/[[...slug]]/route.ts   CopilotKit runtime → Bedrock
│   │   └── travel/generate/route.ts          Initial plan + steering JSON endpoint
│   ├── travel/
│   │   ├── page.tsx                          Splash screen with 4 presets
│   │   └── plan/page.tsx                     Plan page: hero, rail, tabs, sidebar
│   └── layout.tsx                            Root, wraps app in CopilotKitProvider
└── lib/travel/
    ├── types.ts                              TripPlan + DecisionCategory + Theme
    ├── state.ts                              localStorage helpers
    └── bedrock.ts                            Shared Bedrock client (used by /api/travel/generate)
```

Everything else in the repo is the original starter kit and is **not currently used** — the Python LangGraph agent (`apps/agent/`), the BFF (`apps/bff/`), the MCP server (`apps/mcp/`), and the `/leads` canvas demo are all dormant in this fork.

---

## How we used CopilotKit

The hackathon brief is about **Generative UI** — CopilotKit is the primitive we lean on.

- **Shared agent context** (`useAgentContext`) exposes the live `TripPlan` to the agent on every render. The agent's tool calls reference ids straight from that context.
- **Frontend tools** (`useFrontendTool` × 5) register React-side handlers that mutate local state, so the chat and the explicit UI buttons drive the *exact same* mutation path.
- **Sidebar chat** (`CopilotSidebar`) opens a chat surface over the plan page. No custom chat UI — the sidebar inherits the theme and sits over the app.
- **Embedded runtime** lives at `/api/copilotkit/[[...slug]]` so the whole app ships from one Next.js server with no auxiliary services.

What we didn't use (deferred, not rejected): A2UI declarative components, `openGenerativeUI` / MCP Apps, persistent threads, `useCoAgent` state syncing (we use `useAgentContext` for one-way sharing).

---

## Files changed from the starter

- `apps/frontend/src/app/page.tsx` — fixed a broken `const tiles = [...]` array from the starter commit
- `apps/frontend/src/app/travel/page.tsx` — rewritten as the splash
- `apps/frontend/src/app/travel/plan/page.tsx` — new
- `apps/frontend/src/app/api/copilotkit/[[...slug]]/route.ts` — new, replaces BFF proxy
- `apps/frontend/src/app/api/travel/generate/route.ts` — new
- `apps/frontend/src/lib/travel/` — new
- `apps/frontend/next.config.ts` — removed BFF rewrite, added `serverExternalPackages: ["@copilotkit/runtime"]`
- `apps/frontend/.env.local` — new (gitignored); AWS profile + region + model id

---

## License

MIT (inherited from the starter kit).

---

> Built for the Generative UI Global Hackathon: Agentic Interfaces.
> Starter kit by the CopilotKit team — <https://github.com/CopilotKit/Generative-UI-Global-Hackathon-Starter-Kit>.
