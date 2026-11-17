import { loadEnv, requireLlm, toPublicConfig } from "@/lib/config/env";
import { ConfigError } from "@/lib/errors";

const failures: string[] = [];

const config = loadEnv();

if (config.evaluationAsOfDate !== "2026-06-05") {
  failures.push(
    `CONTINUA_EVALUATION_AS_OF_DATE must be 2026-06-05, got ${config.evaluationAsOfDate}`,
  );
}

if (config.demoMode && !config.llmApiKey) {
  // Expected: demo mode must boot without credentials.
  requireLlmSafe(config);
}

const publicConfig = toPublicConfig(config);
const serialized = JSON.stringify(publicConfig);
for (const key of ["llmApiKey", "supabaseAnonKey", "apiKey", "secret"]) {
  if (serialized.includes(key)) {
    failures.push(`public config leaks field name "${key}"`);
  }
}

function requireLlmSafe(candidate: typeof config): void {
  try {
    requireLlm(candidate);
    failures.push("requireLlm should have failed without credentials in demo mode");
  } catch (error) {
    if (!(error instanceof ConfigError)) {
      failures.push("requireLlm threw the wrong error type");
    }
  }
}

if (failures.length > 0) {
  console.error("Environment validation failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Environment validation passed: demo mode boots without credentials.");
