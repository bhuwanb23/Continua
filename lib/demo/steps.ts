import { FLAGSHIP_PATIENT_ID, SCENES, type DemoScene } from "@/lib/demo/flagship";

export function clampScene(index: number): number {
  if (!Number.isFinite(index)) return 1;
  return Math.min(Math.max(Math.trunc(index), 1), SCENES.length);
}

export function sceneFor(index: number): DemoScene {
  return SCENES[clampScene(index) - 1]!;
}

/** Anchor the demo highlights for a scene. Never changes data. */
export function focusTargetForScene(index: number): string | null {
  switch (clampScene(index)) {
    case 2:
      return "queue";
    case 3:
      return "timeline";
    case 4:
      return "flagship-gap";
    case 5:
      return "evidence";
    case 6:
      return "evaluation";
    default:
      return null;
  }
}

/** Route a scene corresponds to, for the "open the real screen" link. */
export function routeForScene(index: number): string {
  switch (clampScene(index)) {
    case 3:
    case 4:
    case 5:
      return `/patients/${FLAGSHIP_PATIENT_ID}`;
    case 6:
      return "/evaluation";
    default:
      return "/";
  }
}

export { FLAGSHIP_PATIENT_ID };
