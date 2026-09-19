import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, status: "alive", timestamp: new Date().toISOString() });
}
