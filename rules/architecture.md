# Project Architecture Notes
> **AI Instruction:** All proposed solutions and code structures must align with the decisions documented here.

# Project Architecture Notes
> **AI Instruction:** All proposed solutions and code structures must align with the decisions documented here.

## 1. High-Level Paradigm
- **Paradigm:** Functional / Generative UI (CopilotKit)
- **State Management:** React Context + LocalStorage for persistence. Single source of truth in `TripPlan` object.

## 2. Directory Structure
- `apps/frontend/src/`: Core application logic.
    - `components/travel/`: Travel-specific UI components (Itinerary, Map, Cards).
    - `lib/travel/`: Schema definitions, mock data, and state logic.
    - `hooks/`: Custom hooks for state and CopilotKit integration.

## 3. Data Flow
1. User provides intent via Wizard or Chat.
2. CopilotKit Agent generates/updates `TripPlan` JSON.
3. Frontend renders `TripPlan` via `CardRenderer` and `Map`.
4. User "kicks out" an item -> Tool call updates `TripPlan` -> Partial re-render.
5. State persisted to `localStorage` on every change.

## 4. TripPlan Schema
```typescript
interface TripPlan {
  id: string;
  destination: string;
  dates: { start: string; end: string };
  preferences: {
    budget: 'low' | 'medium' | 'high';
    interests: string[];
    pace: 'relaxed' | 'moderate' | 'fast';
  };
  itinerary: DayPlan[];
}

interface DayPlan {
  day: number;
  date: string;
  items: ItineraryItem[];
}

interface ItineraryItem {
  id: string;
  type: 'activity' | 'accommodation' | 'transport' | 'food';
  title: string;
  description: string;
  location: { lat: number; lng: number; address: string };
  startTime?: string;
  endTime?: string;
  cost?: number;
  status: 'suggested' | 'confirmed' | 'rejected';
}
```

## 5. Third-Party Integrations
- **Leaflet:** Handled in `components/travel/Map.tsx`. Used for interactive map without API keys.
- **CopilotKit:** Handled in `components/copilot/`. Used for generative UI and agent actions.

