import { logger } from "../logger.js";

export type Sweep = { name: string; run(): Promise<{ acted: number }> };
export type SweepResult = { name: string; ok: boolean; acted: number; ms: number };

export async function runOnce(sweeps: Sweep[]): Promise<SweepResult[]> {
  const results: SweepResult[] = [];
  for (const s of sweeps) {
    const t0 = Date.now();
    try {
      const { acted } = await s.run();
      results.push({ name: s.name, ok: true, acted, ms: Date.now() - t0 });
      logger.info({ sweep: s.name, acted, ms: Date.now() - t0 }, "sweep ok");
    } catch (err) {
      results.push({ name: s.name, ok: false, acted: 0, ms: Date.now() - t0 });
      logger.error({ sweep: s.name, err }, "sweep failed");
    }
  }
  return results;
}

export function startRunner(intervalMs: number, sweeps: Sweep[]): () => void {
  const timer = setInterval(() => {
    void runOnce(sweeps);
  }, intervalMs);
  return () => clearInterval(timer);
}
