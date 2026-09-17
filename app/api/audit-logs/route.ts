import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  const logs = await prisma.activityLog.findMany({ take: 200, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } } } });
  return NextResponse.json({ success: true, data: logs });
}