"use client";

import { useEffect, useState } from "react";
import { TripPlan } from "@/lib/travel/types";
import { loadTripPlan, saveTripPlan } from "@/lib/travel/state";
import { getMockTripPlan } from "@/lib/travel/mock";

export default function TravelPage() {
  const [plan, setPlan] = useState<TripPlan | null>(null);

  useEffect(() => {
    const saved = loadTripPlan();
    if (saved) {
      setPlan(saved);
    } else {
      const mock = getMockTripPlan();
      setPlan(mock);
      saveTripPlan(mock);
    }
  }, []);

  if (!plan) return <div>Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="p-6 border-b">
        <h1 className="text-2xl font-bold">Travel Planner: {plan.destination}</h1>
        <p className="text-muted-foreground">
          {plan.dates.start} to {plan.dates.end}
        </p>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Itinerary Column */}
        <div className="w-1/2 overflow-y-auto p-6 space-y-8">
          {plan.itinerary.map((day) => (
            <div key={day.day} className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">
                Day {day.day} - {day.date}
              </h2>
              <div className="grid gap-4">
                {day.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border bg-card hover:border-accent transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-medium uppercase tracking-wider text-accent">
                          {item.type}
                        </span>
                        <h3 className="text-lg font-bold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="text-right">
                        {item.startTime && (
                          <p className="text-sm font-medium">
                            {item.startTime} - {item.endTime}
                          </p>
                        )}
                        <button className="mt-2 text-xs text-red-500 hover:underline">
                          Kick out
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Map Column */}
        <div className="w-1/2 bg-muted relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground italic">Map will be rendered here (Leaflet)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
