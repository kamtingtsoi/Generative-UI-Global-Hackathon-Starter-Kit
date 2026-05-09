# Project Plan
> **AI Instruction:** Treat this file as the absolute source of truth for the project's state. When asked what we are building or what the next steps are, refer to this document.

## Vision Statement
Build a generative travel planning experience that turns a user’s trip intent into a structured, editable itinerary instead of a static search-and-book flow. The product is for travelers who want a faster, more guided way to plan trips, with AI-generated suggestions for flights, accommodation, attractions, and transport that can be revised through direct “kick out” feedback. The core value is proactive trip drafting with interactive refinement, powered by CopilotKit generative UI and persistent user preferences.

## Scope & Constraints
- **In scope:** Guided wizard-style trip intake, travel preference capture, itinerary generation, accommodation and attraction suggestions, transport suggestions, editable recommendations, negative feedback capture, preference memory/profile support, map-based context, and a right-side decision/update panel.
- **Out of scope:** Full booking checkout, payment processing, airline or hotel account management, multi-trip travel agency workflows, offline mode, and exhaustive global inventory coverage.
- **Constraints:** Use CopilotKit as the generative UI framework, keep the UI responsive and incremental, persist user preferences in a memory/profile layer, avoid brittle free-form regeneration, and keep the hackathon MVP lightweight enough to demo reliably.

## System Architecture
- **Core Entity:** A `TripPlan` object composed of user profile preferences, trip constraints, generated components, and user feedback history.
- **Data Flow:** User enters a prompt or selects a template in the splash screen; CopilotKit drives the wizard UI; the agent converts intent into structured travel components; the state layer stores the itinerary as JSON; user removals or negative prompts update the plan and trigger partial regeneration.
- **Primary Interfaces:** Web UI wizard, generative side panel, itinerary cards, editable decision rail, map preview, and CopilotKit agent actions/components.
- **Key Dependencies:** CopilotKit, a React-based frontend, a backend agent orchestration layer, a memory/profile store, travel search APIs or mock data, and optional map/location services.

## Roadmap
> Use `[x]` for finished items, `[/]` for items currently being worked on, and `[ ]` for future tasks.

### Phase 1: MVP Core
- `[ ]` Define or update `rules/architecture.md`
- `[ ]` Set up project skeleton (repo, linting, CI, etc.)
- `[ ]` Implement core feature X
- `[ ]` Implement basic security posture (auth, logging, secrets handling)

### Phase 2: Refinement
- `[ ]` Write unit and integration tests
- `[ ]` Finalize comments, docs, and `README.md`
- `[ ]` Optimize performance and error-handling
- `[ ]` Polish UX / CLI UX

### Phase 3: Hardening & Observability
- `[ ]` Add logging, metrics, and alerts
- `[ ]` Run security-oriented review (e.g., secrets, auth, input validation)

## Current Execution Status
- **Current Task:** Creating core travel data structures and scaffolding frontend components.
- **Recent accomplishment:** Defined TripPlan schema and architecture rules.
- **Blocked By:** None.
- **Next Steps (next 1–3):**
  1. Scaffold `apps/frontend/src/lib/travel/state.ts` for LocalStorage persistence.
  2. Create a mock itinerary generator utility.
  3. Implement the first travel UI component (Itinerary Card).

## Risks & Assumptions
- **Key risks:** Travel data freshness, partial regeneration complexity, unclear UX if too many components are generated at once, and agent drift when user feedback is unstructured.
- **Assumptions:** Users will accept a guided wizard instead of open-ended chat, travel suggestions can be stubbed or mocked for the hackathon demo, and CopilotKit will handle the generative UI interaction model cleanly.

*Note to Human: Update “Current Execution Status” and “Risks & Assumptions” at the end of every programming session. Use `PROJECT_PLAN.md` + `agent_logs/*` + `rules/` to keep agents aligned.*
