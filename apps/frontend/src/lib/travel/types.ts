export type Theme = {
  name: string;
  vibe: string;
  accent: string;
  background: string;
  headline: string;
  subhead: string;
  emoji: string;
};

export type DecisionCategory =
  | "flight"
  | "transportation"
  | "accommodation"
  | "attraction"
  | "food"
  | "other";

export const CORE_CATEGORIES: DecisionCategory[] = [
  "flight",
  "transportation",
  "accommodation",
  "attraction",
];

export const CATEGORY_LABELS: Record<DecisionCategory, string> = {
  flight: "Flight",
  transportation: "Local transportation",
  accommodation: "Accommodation",
  attraction: "Attractions",
  food: "Food",
  other: "Other",
};

export const CATEGORY_EMOJI: Record<DecisionCategory, string> = {
  flight: "✈️",
  transportation: "🚆",
  accommodation: "🏨",
  attraction: "📍",
  food: "🍜",
  other: "✨",
};

export type DecisionItem = {
  id: string;
  category: DecisionCategory;
  title: string;
  summary: string;
  status: "suggested" | "booked" | "kicked";
};

export type SuggestionTile = {
  id: string;
  category: DecisionCategory;
  title: string;
  description: string;
  emoji: string;
};

export type ItineraryItem = {
  time?: string;
  title: string;
  detail?: string;
  category: DecisionCategory;
};

export type ItineraryDay = {
  day: number;
  date?: string;
  label?: string;
  items: ItineraryItem[];
};

export type TripPlan = {
  prompt: string;
  theme: Theme;
  destination: string;
  decisions: DecisionItem[];
  suggestions: SuggestionTile[];
  itinerary: ItineraryDay[];
};
