import { execFileSync } from "node:child_process";

const trackedArtifacts = [
  "artifacts/submission/submission-manifest.json",
  "artifacts/submission/approved-claims.json",
  "artifacts/submission/links.json",
  "artifacts/judging/final-metrics.json",
  "artifacts/release/release-candidate.json",
  "artifacts/release/blockers.json",
];

const ignored = trackedArtifacts.filter((file) => {
  try {
    execFileSync("git", ["check-ignore", file], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
});

console.log(JSON.stringify({ status: ignored.length ? "FAIL" : "PASS", ignored }, null, 2));
if (ignored.length) process.exit(1);
