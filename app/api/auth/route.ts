import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ success: false, message: "Use the secure login form" }, { status: 405 });
}

export async function GET() {
  return NextResponse.json({ success: false, message: "Use the authenticated session" }, { status: 401 });
}

export async function DELETE() {
  return NextResponse.json({ success: true, message: "Logged out" });
}
