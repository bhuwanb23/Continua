import { z } from "zod";
import { ConfigError } from "@/lib/errors";
import { EVALUATION_AS_OF_DATE } from "@/lib/domain/versions";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const RawEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Continua"),
  CONTINUA_DEMO_MODE: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  CONTINUA_EVALUATION_AS_OF_DATE: isoDate.default(EVALUATION_AS_OF_DATE),
  LLM_PROVIDER: z.string().min(1).optional(),
  LLM_API_KEY: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

export interface ServerConfig {
  nodeEnv: "development" | "test" | "production";
  appName: string;
  demoMode: boolean;
  evaluationAsOfDate: string;
  llmProvider?: string | undefined;
  llmApiKey?: string | undefined;
  supabaseUrl?: string | undefined;
  supabaseAnonKey?: string | undefined;
}

export interface PublicConfig {
  appName: string;
  demoMode: boolean;
  evaluationAsOfDate: string;
}

export function loadEnv(source: Record<string, string | undefined> = process.env): ServerConfig {
  const parsed = RawEnvSchema.safeParse(source);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new ConfigError(`Invalid environment configuration: ${detail}`);
  }

  const value = parsed.data;
  return {
    nodeEnv: value.NODE_ENV,
    appName: value.NEXT_PUBLIC_APP_NAME,
    demoMode: value.CONTINUA_DEMO_MODE,
    evaluationAsOfDate: value.CONTINUA_EVALUATION_AS_OF_DATE,
    llmProvider: value.LLM_PROVIDER,
    llmApiKey: value.LLM_API_KEY,
    supabaseUrl: value.SUPABASE_URL,
    supabaseAnonKey: value.SUPABASE_ANON_KEY,
  };
}

/** Only non-secret values may cross to the client. */
export function toPublicConfig(config: ServerConfig): PublicConfig {
  return {
    appName: config.appName,
    demoMode: config.demoMode,
    evaluationAsOfDate: config.evaluationAsOfDate,
  };
}

export function requireLlm(config: ServerConfig): { provider: string; apiKey: string } {
  if (!config.llmProvider || !config.llmApiKey) {
    throw new ConfigError("LLM provider not configured.");
  }
  return { provider: config.llmProvider, apiKey: config.llmApiKey };
}
