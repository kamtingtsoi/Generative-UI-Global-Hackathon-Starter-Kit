export interface TripPlan {
  id: string;
  destination: string;
  dates: {
    start: string;
    end: string;
  };
  preferences: {
    budget: 'low' | 'medium' | 'high';
    interests: string[];
    pace: 'relaxed' | 'moderate' | 'fast';
  };
  itinerary: DayPlan[];
}

export interface DayPlan {
  day: number;
  date: string;
  items: ItineraryItem[];
}

export interface ItineraryItem {
  id: string;
  type: 'activity' | 'accommodation' | 'transport' | 'food';
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  startTime?: string;
  endTime?: string;
  cost?: number;
  status: 'suggested' | 'confirmed' | 'rejected';
}
