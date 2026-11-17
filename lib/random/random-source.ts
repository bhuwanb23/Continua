export interface RandomSource {
  /** Uniform float in [0, 1). */
  next(): number;
}

export class MathRandomSource implements RandomSource {
  next(): number {
    return Math.random();
  }
}

/**
 * Deterministic PRNG. Same seed → identical sequence, on every machine.
 */
export class SeededRandomSource implements RandomSource {
  private state: number;

  constructor(seed: number) {
    if (!Number.isFinite(seed)) {
      throw new Error("SeededRandomSource requires a finite numeric seed");
    }
    this.state = seed >>> 0;
  }

  next(): number {
    // mulberry32
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export const DEFAULT_SEED = 20260605;
