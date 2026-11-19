import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildOpenApiDocument } from "@/lib/api/openapi";

function routePaths(root: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) out.push(...routePaths(path));
    else if (entry.name === "route.ts") {
      const relative = path.slice(join(process.cwd(), "app").length).replaceAll("\\", "/");
      out.push(relative.replace(/\/route\.ts$/, "").replace(/\[([^\]]+)\]/g, "{$1}"));
    }
  }
  return out.sort();
}

describe("continua-api-v1 OpenAPI document", () => {
  it("documents exactly the implemented route tree", () => {
    const document = buildOpenApiDocument();
    const paths = Object.keys(document.paths as Record<string, unknown>).sort();
    expect(paths).toEqual(routePaths(join(process.cwd(), "app", "api", "v1")));
    expect(paths).toHaveLength(12);
  });

  it("declares every operation with a tag and at least one response", () => {
    const paths = buildOpenApiDocument().paths as Record<string, Record<string, { tags?: string[]; responses?: object }>>;
    for (const [path, operations] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(operations)) {
        expect(operation.tags?.length, `${method.toUpperCase()} ${path}`).toBeGreaterThan(0);
        expect(Object.keys(operation.responses ?? {}), `${method.toUpperCase()} ${path}`).toContain("200");
      }
    }
  });

  it("never documents a ground-truth or candidate path", () => {
    const paths = Object.keys(buildOpenApiDocument().paths as Record<string, unknown>).join(",");
    expect(paths).not.toMatch(/ground[-_]truth|negative[-_]manifest|candidate/i);
  });
});
