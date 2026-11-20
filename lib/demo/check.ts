import { validateDemo } from "@/lib/demo/validate";

export async function checkDemo(): Promise<{ ok: boolean; failed: string[] }> {
  const validation = await validateDemo();
  return {
    ok: validation.ok,
    failed: validation.checks.filter((check) => !check.ok).map((check) => check.name),
  };
}
