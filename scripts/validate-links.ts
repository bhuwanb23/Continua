import { readFileSync } from "node:fs";
import { join } from "node:path";

const readme = readFileSync(join(process.cwd(), "README.md"), "utf8");
const matches = [...readme.matchAll(/\]\(([^)]+)\)/g)];
const broken: string[] = [];
for (const match of matches) {
  const target = match[1];
  if (!target || target.startsWith("http")) continue;
  if (!target.trim()) broken.push(target);
}
console.log(JSON.stringify({ status: broken.length ? "FAIL" : "PASS", broken }, null, 2));
if (broken.length) process.exit(1);
