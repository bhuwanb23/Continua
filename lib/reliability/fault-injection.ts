/**
 * Test-only fault injection.
 *
 * There is deliberately no environment variable, query parameter, or route that
 * enables these faults in a running app. Tests and rehearsal scripts construct
 * an injector explicitly, so production traffic can never toggle failure modes.
 */
export const FAULT_FLAGS = [
  "FAIL_LLM",
  "FAIL_REPOSITORY",
  "CORRUPT_CACHE_HASH",
  "DROP_SOURCE_DOC",
  "ALTER_SOURCE_SPAN",
  "DELAY_API",
  "FAIL_EVIDENCE_API",
  "STALE_PRIORITY_VERSION",
  "PARTIAL_EXTRACTION",
] as const;
export type FaultFlag = (typeof FAULT_FLAGS)[number];

export class InjectedFault extends Error {
  readonly flag: FaultFlag;

  constructor(flag: FaultFlag) {
    super(`Injected fault: ${flag}`);
    this.name = "InjectedFault";
    this.flag = flag;
  }
}

export interface FaultActivation {
  flag: FaultFlag;
  at: string;
  detail?: string;
}

export interface FaultInjector {
  readonly flags: ReadonlySet<FaultFlag>;
  has(flag: FaultFlag): boolean;
  /** Throws InjectedFault when active; otherwise runs the function. */
  guard<T>(flag: FaultFlag, run: () => T): T;
  /** Async guard, same semantics. */
  guardAsync<T>(flag: FaultFlag, run: () => Promise<T>): Promise<T>;
  /** Activations recorded in order, for scenario evidence. */
  activations(): readonly FaultActivation[];
}

export function createFaultInjector(
  flags: readonly FaultFlag[],
  now: () => string = () => new Date().toISOString(),
): FaultInjector {
  const active = new Set(flags);
  const recorded: FaultActivation[] = [];
  const miss = (flag: FaultFlag) => {
    recorded.push({ flag, at: now() });
  };
  return {
    flags: active,
    has: (flag) => active.has(flag),
    guard<T>(flag: FaultFlag, run: () => T): T {
      if (active.has(flag)) {
        miss(flag);
        throw new InjectedFault(flag);
      }
      return run();
    },
    async guardAsync<T>(flag: FaultFlag, run: () => Promise<T>): Promise<T> {
      if (active.has(flag)) {
        miss(flag);
        throw new InjectedFault(flag);
      }
      return run();
    },
    activations: () => recorded,
  };
}

/** Applies a latency fault without touching a real network stack. */
export async function withInjectedDelay<T>(
  injector: FaultInjector,
  flag: FaultFlag,
  delayMs: number,
  run: () => Promise<T>,
): Promise<T> {
  if (delayMs < 0 || !Number.isFinite(delayMs)) throw new Error("delayMs must be finite and >= 0");
  if (injector.has(flag)) await new Promise((resolve) => setTimeout(resolve, delayMs));
  return run();
}

/** True only when the process is a test runner; rehearsal scripts bypass this. */
export function faultsAllowedInCurrentProcess(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.NODE_ENV === "test" || env.CONTINUA_RELIABILITY_REHEARSAL === "1";
}
