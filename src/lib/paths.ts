import path from "path";

export function projectRoot(): string {
  return process.cwd();
}

export function fixturesDir(): string {
  return path.join(projectRoot(), "fixtures");
}

export function invoicesDir(): string {
  return path.join(fixturesDir(), "invoices");
}

export function dataDir(): string {
  return path.join(projectRoot(), "data");
}

export function uploadsDir(): string {
  return path.join(dataDir(), "uploads");
}

export function runsDbPath(): string {
  return path.join(dataDir(), "runs.json");
}
