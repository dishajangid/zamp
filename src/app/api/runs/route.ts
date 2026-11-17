import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { listRuns, ensureUploadDir } from "@/lib/db";
import { loadCases, fixturePdfPath } from "@/lib/load-fixtures";
import { startRunFromFile } from "@/lib/execute-run";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ runs: listRuns() });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as { fixtureId?: string };
      if (!body.fixtureId) {
        return NextResponse.json(
          { error: "fixtureId is required" },
          { status: 400 }
        );
      }
      const cases = loadCases();
      const meta = cases.find((c) => c.id === body.fixtureId);
      if (!meta) {
        return NextResponse.json(
          { error: `Unknown fixture: ${body.fixtureId}` },
          { status: 404 }
        );
      }
      const src = fixturePdfPath(meta.file);
      if (!fs.existsSync(src)) {
        return NextResponse.json(
          { error: `Fixture PDF missing: ${meta.file}. Run npm run fixtures.` },
          { status: 500 }
        );
      }
      const uploadDir = ensureUploadDir();
      const dest = path.join(
        uploadDir,
        `${Date.now()}-${meta.file}`
      );
      fs.copyFileSync(src, dest);
      const run = await startRunFromFile({
        filename: meta.file,
        filepath: dest,
        fixtureId: meta.id,
      });
      return NextResponse.json({ run }, { status: 201 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "PDF file is required" },
        { status: 400 }
      );
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF uploads are supported" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = ensureUploadDir();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const dest = path.join(uploadDir, `${Date.now()}-${safeName}`);
    fs.writeFileSync(dest, buffer);

    const run = await startRunFromFile({
      filename: file.name,
      filepath: dest,
    });
    return NextResponse.json({ run }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start run";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
