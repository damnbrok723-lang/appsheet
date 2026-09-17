import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ success: false, message: "Registration is disabled. Contact your administrator." }, { status: 403 });
}
