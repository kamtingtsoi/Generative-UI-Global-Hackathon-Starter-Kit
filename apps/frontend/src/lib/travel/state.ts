import type { TripPlan } from "./types";

const KEY = "travel-trip-plan-v2";

export function savePlan(plan: TripPlan) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(plan));
}

export function loadPlan(): TripPlan | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TripPlan;
  } catch {
    return null;
  }
}

export function clearPlan() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
