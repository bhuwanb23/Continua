import { EVALUATION_AS_OF_DATE } from "@/lib/domain/versions";

export interface Clock {
  now(): Date;
  /** ISO calendar date, YYYY-MM-DD, in UTC. */
  todayIso(): string;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  todayIso(): string {
    return toIsoDate(this.now());
  }
}

export class FixedClock implements Clock {
  private readonly iso: string;

  constructor(iso: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      throw new Error(`FixedClock expects YYYY-MM-DD, received "${iso}"`);
    }
    this.iso = iso;
  }

  now(): Date {
    return new Date(`${this.iso}T00:00:00.000Z`);
  }

  todayIso(): string {
    return this.iso;
  }
}

/** The only clock clinical/benchmark paths may use. */
export const benchmarkClock: Clock = new FixedClock(EVALUATION_AS_OF_DATE);
