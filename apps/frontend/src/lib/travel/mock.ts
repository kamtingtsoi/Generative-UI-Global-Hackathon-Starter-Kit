import { TripPlan, DayPlan, ItineraryItem } from './types';

export const MOCK_TRIP_PLAN: TripPlan = {
  id: 'mock-1',
  destination: 'Tokyo, Japan',
  dates: {
    start: '2026-10-10',
    end: '2026-10-12',
  },
  preferences: {
    budget: 'medium',
    interests: ['culture', 'food', 'technology'],
    pace: 'moderate',
  },
  itinerary: [
    {
      day: 1,
      date: '2026-10-10',
      items: [
        {
          id: 'item-1',
          type: 'accommodation',
          title: 'Park Hyatt Tokyo',
          description: 'Luxury hotel with iconic city views.',
          location: { lat: 35.6857, lng: 139.6912, address: '3-7-1-2 Nishi-Shinjuku, Shinjuku-ku' },
          status: 'confirmed',
        },
        {
          id: 'item-2',
          type: 'activity',
          title: 'Meiji Jingu Shrine',
          description: 'Shinto shrine dedicated to Emperor Meiji.',
          location: { lat: 35.6764, lng: 139.6993, address: '1-1 Yoyogikamizonocho, Shibuya City' },
          startTime: '10:00',
          endTime: '12:00',
          status: 'confirmed',
        },
      ],
    },
    {
      day: 2,
      date: '2026-10-11',
      items: [
        {
          id: 'item-3',
          type: 'activity',
          title: 'TeamLab Borderless',
          description: 'Digital art museum with immersive displays.',
          location: { lat: 35.6264, lng: 139.7758, address: 'Odaiba, Tokyo' },
          startTime: '14:00',
          endTime: '17:00',
          status: 'suggested',
        },
      ],
    },
  ],
};

export function getMockTripPlan(): TripPlan {
  return MOCK_TRIP_PLAN;
}
