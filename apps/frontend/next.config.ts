import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Load the repo-root .env so vars defined there (BFF_URL, etc.) are visible
// to next.config.ts and to the dev/prod runtime. Next reads `apps/frontend/.env`
// after this — local overrides still win when present. Replaces the previous
// `ln -sf ../../.env apps/frontend/.env` postinstall, which was non-portable.
loadEnvConfig(path.resolve(__dirname, "../.."));

const nextConfig: NextConfig = {
  // The /travel flow serves CopilotKit directly from Next at
  // src/app/api/copilotkit/route.ts (BuiltInAgent + AWS Bedrock), so no BFF
  // rewrite is needed. The leads demo is not wired up for this branch.

  // @copilotkit/runtime ships an express-backed endpoint in its v2 barrel that
  // Turbopack chokes on (dynamic require in express/lib/view.js). Marking it
  // as external tells Next to `require()` the package at runtime instead of
  // bundling it — our route only uses the fetch-style `createCopilotRuntimeHandler`,
  // so express is never actually invoked.
  serverExternalPackages: ["@copilotkit/runtime"],
};

export default nextConfig;
