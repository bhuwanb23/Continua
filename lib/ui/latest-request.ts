/**
 * Guards async UI reads against out-of-order responses. A late response from a
 * previous patient or evidence request can never overwrite the current one.
 */
export interface RequestToken {
  id: number;
  signal: AbortSignal;
  isCurrent(): boolean;
}

export interface LatestRequestGuard {
  begin(): RequestToken;
  isCurrent(id: number): boolean;
  cancel(): void;
}

export function createLatestRequestGuard(): LatestRequestGuard {
  let sequence = 0;
  let controller: AbortController | null = null;
  return {
    begin(): RequestToken {
      controller?.abort();
      sequence += 1;
      controller = new AbortController();
      const id = sequence;
      return {
        id,
        signal: controller.signal,
        isCurrent: () => id === sequence,
      };
    },
    isCurrent(id: number): boolean {
      return id === sequence;
    },
    cancel(): void {
      sequence += 1;
      controller?.abort();
      controller = null;
    },
  };
}
