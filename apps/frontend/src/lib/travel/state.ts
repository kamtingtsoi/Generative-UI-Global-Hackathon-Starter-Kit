import { TripPlan } from './types';

const STORAGE_KEY = 'trip_plan_state';

export function saveTripPlan(plan: TripPlan): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }
}

export function loadTripPlan(): TripPlan | null {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse trip plan from local storage', e);
        return null;
      }
    }
  }
  return null;
}

export function clearTripPlan(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
