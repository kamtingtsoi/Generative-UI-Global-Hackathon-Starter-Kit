import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
} from "@aws-sdk/client-bedrock-runtime";
import { fromIni } from "@aws-sdk/credential-providers";

let cached: BedrockRuntimeClient | null = null;

function getClient(): BedrockRuntimeClient {
  if (cached) return cached;
  const profile = process.env.AWS_PROFILE;
  const region = process.env.AWS_REGION ?? "us-west-2";
  cached = new BedrockRuntimeClient({
    region,
    credentials: profile ? fromIni({ profile }) : undefined,
  });
  return cached;
}

export function getModelId(): string {
  return (
    process.env.BEDROCK_MODEL_ID ??
    "us.anthropic.claude-haiku-4-5-20251001-v1:0"
  );
}

export async function converseJson<T>(args: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const client = getClient();
  const messages: Message[] = [
    { role: "user", content: [{ text: args.user }] },
  ];

  const res = await client.send(
    new ConverseCommand({
      modelId: getModelId(),
      system: [{ text: args.system }],
      messages,
      inferenceConfig: {
        maxTokens: args.maxTokens ?? 2000,
        temperature: 0.7,
      },
    }),
  );

  const text = res.output?.message?.content
    ?.map((b) => ("text" in b ? b.text : ""))
    .join("")
    .trim();

  if (!text) throw new Error("Empty Bedrock response");

  const jsonMatch =
    text.match(/```json\s*([\s\S]*?)```/) ??
    text.match(/```\s*([\s\S]*?)```/) ??
    null;
  const raw = jsonMatch ? jsonMatch[1] : text;
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1)
    throw new Error(`No JSON object in model output: ${text}`);
  const jsonStr = raw.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonStr) as T;
}
