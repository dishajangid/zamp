import { NextResponse } from "next/server";
import { loadCases } from "@/lib/load-fixtures";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ cases: loadCases() });
}
