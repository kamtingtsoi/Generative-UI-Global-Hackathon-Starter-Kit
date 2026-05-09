# Vibecoding Starter Harness

Welcome to your agentic engineering workspace. This repository acts as the "living context" for your conversational AI coding assistants.

To effectively practice agentic engineering, the AI needs persistent context. Instead of hoping the model remembers everything during a long session, we explicitly manage its long-term memory through these markdown files.

## How to Start a Session

At the start of every new chat session, attach the following files to your initial prompt:
1. `PLAN.md` — establishes what the system is and what we are working on today.
2. `agent_logs/debug.md` — prevents the AI from repeating past mistakes.
3. `AGENTS.md` — references the specific behavior you want from the given agent.

In your prompt, write something like:
> "Read the attached project plan and debug log. I would like to work on task X as defined in the roadmap."

## Directory Structure

```text
├── PLAN.md                  Living memory — goals, roadmap, current task
├── AGENTS.md                Agent personas + behavior guide
├── README.md                This file — how to use the harness
├── CHANGELOG.md             Notable project changes
├── rules/
│   ├── architecture.md      Project structure & patterns
│   ├── env.md               Shell / CLI environment rules
│   └── style-guide.md       Code style, naming, testing
└── agent_logs/
    ├── security.md          Security analysis & mitigations
    ├── design.md            Design decisions, UX flows, data models
    ├── engineering.md       Implementation tasks & progress
    ├── research.md          Tech-stack investigations & PoCs
    └── debug.md             Bug investigations & resolutions
```

## Tech Stack

> Update these once your architecture is defined in `PLAN.md`.

| Layer     | Technology | Notes |
|-----------|------------|-------|
| Frontend  | [TBD]      |       |
| Backend   | [TBD]      |       |
| Database  | [TBD]      |       |
| Deployment| [TBD]      |       |
