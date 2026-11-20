import { resetDemoState } from "@/lib/demo/reset";

function main() {
  resetDemoState();
  console.log(JSON.stringify({ ok: true, detail: "demo presentation state reset" }, null, 2));
}

main();
