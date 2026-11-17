import { NextResponse } from "next/server";
import { DISCLAIMER } from "@/lib/domain/api";
import { VERSION_METADATA, EVALUATION_AS_OF_DATE } from "@/lib/domain/versions";
import { loadEnv, toPublicConfig } from "@/lib/config/env";

export function GET(): NextResponse {
  const config = toPublicConfig(loadEnv());
  return NextResponse.json({
    status: "ok",
    app: config.appName,
    demo_mode: config.demoMode,
    evaluation_as_of_date: EVALUATION_AS_OF_DATE,
    versions: VERSION_METADATA,
    disclaimer: DISCLAIMER,
  });
}
