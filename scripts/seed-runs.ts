import fs from "fs";
import path from "path";
import { clearRuns } from "../src/lib/db";
import { loadCases, fixturePdfPath } from "../src/lib/load-fixtures";
import { runFixtureToCompletion } from "../src/lib/execute-run";
import { toPriorRecord } from "../src/lib/pipeline/run";
import type { PriorInvoiceRecord } from "../src/lib/types";
import type { PipelineResult } from "../src/lib/types";

async function main(): Promise<void> {
  const cases = loadCases();
  for (const c of cases) {
    const p = fixturePdfPath(c.file);
    if (!fs.existsSync(p)) {
      console.error(`Missing ${c.file}. Run: npm run fixtures`);
      process.exit(1);
    }
  }

  clearRuns();
  console.log("Cleared existing runs.");

  const seedPriors: PriorInvoiceRecord[] = [];

  for (const c of cases) {
    const run = await runFixtureToCompletion({
      filename: c.file,
      filepath: fixturePdfPath(c.file),
      fixtureId: c.id,
      stageDelayMs: 0,
      seeded: true,
      priorInvoices: [...seedPriors],
    });
    console.log(
      `${c.id} ${c.label}: decision=${run.decision} (expected ${c.expectedDecision})`
    );
    if (run.decision !== c.expectedDecision) {
      console.error(`Mismatch for ${c.id}`);
      process.exit(1);
    }

    // Build in-memory priors for subsequent seed cases (TR-4 needs TR-1).
    if (run.decision && run.extracted) {
      const synthetic: PipelineResult = {
        decision: run.decision,
        reasons: run.reasons || [],
        extracted: run.extracted,
        stages: run.stages,
        matchedVendor: run.matchedVendor,
        matchedPo: run.matchedPo,
        remainingBalance: run.remainingBalance,
        variance: run.variance,
        isDuplicate: run.isDuplicate,
      };
      const prior = toPriorRecord(synthetic);
      if (prior) seedPriors.push(prior);
    }
  }

  const dataPath = path.join(process.cwd(), "data", "runs.json");
  console.log(`Seeded ${cases.length} runs → ${dataPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
