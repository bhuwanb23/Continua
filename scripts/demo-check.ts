import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { checkDemo } from "@/lib/demo/check";

async function main() {
  const result = await checkDemo();
  mkdirSync(join(process.cwd(), "artifacts", "demo"), { recursive: true });
  writeFileSync(join(process.cwd(), "artifacts", "demo", "check-result.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
