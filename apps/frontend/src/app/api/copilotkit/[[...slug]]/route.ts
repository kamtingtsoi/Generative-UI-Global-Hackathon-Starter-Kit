import { streamText } from "ai";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromIni } from "@aws-sdk/credential-providers";
import {
  BuiltInAgent,
  CopilotRuntime,
  convertMessagesToVercelAISDKMessages,
  convertToolsToVercelAITools,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_SYSTEM = `You are a generative travel-planning copilot embedded in a Next.js app.
The user's current TripPlan is shared with you via context messages (useCopilotReadable) and you can mutate the UI by calling the registered frontend tools.

You have these frontend tools:
- bookSuggestion(suggestionId): move a suggestion tile into the booked decisions rail.
- kickOutDecision(decisionId): remove a booked item and ask for a replacement.
- suggestForCategory(category): generate 2-3 new suggestion tiles for "flight" | "transportation" | "accommodation" | "attraction" | "food" | "other".
- regenerateItinerary(): rebuild the day-by-day itinerary from scratch around current bookings.
- steerPlan(instruction): free-form refinement — use this for anything not covered by the tools above (rethemes, multi-step changes, swaps, etc).

Rules:
- Prefer the specific tools over steerPlan when they fit.
- When the user asks for options you don't see listed in current suggestions, call suggestForCategory first.
- When the user confirms a suggestion, call bookSuggestion with the suggestion id from the shared state.
- Keep replies short — one or two sentences explaining what you did. The UI shows the actual changes.`;

const bedrock = createAmazonBedrock({
  region: process.env.AWS_REGION ?? "us-west-2",
  credentialProvider: process.env.AWS_PROFILE
    ? fromIni({ profile: process.env.AWS_PROFILE })
    : undefined,
});

const modelId =
  process.env.BEDROCK_MODEL_ID ??
  "us.anthropic.claude-haiku-4-5-20251001-v1:0";

const agent = new BuiltInAgent({
  type: "aisdk",
  factory: ({ input, abortSignal }) => {
    return streamText({
      model: bedrock(modelId),
      system: AGENT_SYSTEM,
      messages: convertMessagesToVercelAISDKMessages(input.messages),
      tools: convertToolsToVercelAITools(input.tools ?? []),
      abortSignal,
    });
  },
});

const runtimeInstance = new CopilotRuntime({
  agents: { default: agent },
});

const handler = createCopilotRuntimeHandler({
  runtime: runtimeInstance,
  basePath: "/api/copilotkit",
});

export async function GET(req: Request) {
  return handler(req);
}

export async function POST(req: Request) {
  return handler(req);
}

export async function PATCH(req: Request) {
  return handler(req);
}

export async function DELETE(req: Request) {
  return handler(req);
}
