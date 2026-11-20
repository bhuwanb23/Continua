import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { checkDemo } from "@/lib/demo/check";

async function main() {
  const result = await checkDemo();
  const artifact = {
    version: "continua-demo-release-candidate-v1",
    generated_at: new Date().toISOString(),
    hosted_url: process.env.NEXT_PUBLIC_APP_URL ?? "not-configured",
    ok: result.ok,
    failed: result.failed,
    status: result.ok ? "PASS" : "FAIL",
  };
  mkdirSync(join(process.cwd(), "artifacts", "performance"), { recursive: true });
  writeFileSync(join(process.cwd(), "artifacts", "performance", "deployment-smoke.json"), `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify(artifact, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
