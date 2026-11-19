import type { DemoCacheStore } from "./demo-cache-store";
import type { BenchmarkEvaluationRepository, BenchmarkReportArtifact } from "./types";

export class JsonBenchmarkEvaluationRepository implements BenchmarkEvaluationRepository {
  constructor(private readonly store: DemoCacheStore) {}

  async getReport(): Promise<BenchmarkReportArtifact> {
    return this.store.requireCache().evaluation as BenchmarkReportArtifact;
  }
}
