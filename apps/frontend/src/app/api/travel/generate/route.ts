import { NextResponse } from "next/server";

import { converseJson } from "@/lib/travel/bedrock";
import type { TripPlan } from "@/lib/travel/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_INITIAL = `You are a creative travel planning agent. Given a user's trip prompt, you design a bespoke UI theme, infer what is already decided, and draft a complete trip skeleton including a day-by-day itinerary.

Return ONLY a single JSON object with this exact shape (no prose, no markdown):
{
  "prompt": string,                  // echo back the user's prompt
  "destination": string,             // primary destination (city, country)
  "theme": {
    "name": string,                  // short theme name, e.g. "Mountain Marathon", "Onsen Escape"
    "vibe": string,                  // 4-8 word mood phrase
    "accent": string,                // HEX #rrggbb primary accent that matches the vibe
    "background": string,            // HEX #rrggbb very subtle tinted background (near-white)
    "headline": string,              // hero line, <= 60 chars
    "subhead": string,               // supporting line, <= 110 chars
    "emoji": string                  // 1 emoji capturing the trip
  },
  "decisions": [                      // items the user ALREADY confirmed (infer from prompt, e.g. "I already have flights", "running the marathon")
    {
      "id": string,                  // lowercase hyphenated slug
      "category": "flight" | "transportation" | "accommodation" | "attraction" | "food" | "other",
      "title": string,
      "summary": string,             // 1 short sentence
      "status": "booked"
    }
  ],
  "suggestions": [                    // 6-10 tiles the user still needs to decide on
    {
      "id": string,
      "category": "flight" | "transportation" | "accommodation" | "attraction" | "food" | "other",
      "title": string,
      "description": string,         // 1-2 concrete, on-theme sentences
      "emoji": string                // 1 emoji
    }
  ],
  "itinerary": [                      // day-by-day plan covering the full trip duration
    {
      "day": number,                 // 1-indexed
      "date": string,                // optional YYYY-MM-DD, omit or "" if dates unknown
      "label": string,               // short day headline, e.g. "Arrival & onsen", "Race day"
      "items": [
        {
          "time": string,            // "08:00" or "Morning" / "Afternoon" / "Evening", "" if flexible
          "title": string,           // activity name
          "detail": string,          // <= 140 chars context
          "category": "flight" | "transportation" | "accommodation" | "attraction" | "food" | "other"
        }
      ]
    }
  ]
}

Rules:
- Infer purpose (marathon, honeymoon, business, family, etc.) and let it drive theme color + vibe.
- Move anything the prompt already confirms into \`decisions\` with status "booked" — don't also suggest it.
- \`suggestions\` must collectively cover all core categories the user hasn't booked yet: flight (if not booked), transportation, accommodation, attractions. Add food and other as appropriate.
- The itinerary must span the full trip duration implied by the prompt (estimate if not given). Anchor it around booked decisions and top-tier suggestions. 3-5 items per day. Keep titles under 50 chars, details concise and specific.
- No markdown, no emojis outside the emoji fields.`;

const SYSTEM_STEER = `You are updating an existing travel plan based on a user's steering instruction. Apply the change and return the COMPLETE updated TripPlan JSON.

You will receive the current TripPlan JSON and the user's instruction. The user may:
- Confirm a suggestion (move it to decisions with status "booked")
- Kick out / replace a booked item — remove it and offer a replacement
- Add, refine, or swap suggestions in a category
- Regenerate the itinerary or a specific day

Requirements:
- Return ONLY the full updated TripPlan JSON with the same shape (no prose, no markdown).
- Preserve ids of items that are not changing. Use fresh hyphenated-slug ids for new items.
- Keep \`suggestions\` between 5 and 10 items. Suggestions should cover any core category (flight/transportation/accommodation/attraction) the user hasn't booked yet.
- Keep \`itinerary\` synchronized with booked decisions — when the user books or kicks something out, update the relevant days. When the user asks to regenerate the itinerary, rebuild it completely around current bookings and their vibe.
- Keep the theme unless the user explicitly asks to re-theme.`;

type GenerateBody =
  | { mode?: "initial"; prompt: string }
  | { mode: "steer"; plan: TripPlan; instruction: string };

export async function POST(req: Request) {
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  try {
    if (!("mode" in body) || body.mode === "initial") {
      const prompt = "prompt" in body ? body.prompt : "";
      if (!prompt || prompt.trim().length < 5) {
        return NextResponse.json({ error: "prompt too short" }, { status: 400 });
      }
      const plan = await converseJson<TripPlan>({
        system: SYSTEM_INITIAL,
        user: `User prompt:\n"""\n${prompt}\n"""\n\nReturn the JSON now.`,
        maxTokens: 4000,
      });
      return NextResponse.json(plan);
    }

    if (body.mode === "steer") {
      const { plan, instruction } = body;
      if (!plan || !instruction) {
        return NextResponse.json(
          { error: "missing plan or instruction" },
          { status: 400 },
        );
      }
      const updated = await converseJson<TripPlan>({
        system: SYSTEM_STEER,
        user: `Current plan:\n${JSON.stringify(plan)}\n\nUser instruction:\n"""\n${instruction}\n"""\n\nReturn the full updated TripPlan JSON now.`,
        maxTokens: 4500,
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "unknown mode" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[travel/generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
