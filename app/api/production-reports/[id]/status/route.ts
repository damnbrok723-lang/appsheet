import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";

const statusSchema = z.object({ status: z.enum(["SUBMITTED", "REVISION", "APPROVED", "REJECTED"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  const { id } = await params;
  const report = await prisma.productionReport.findUnique({ where: { id } });
  if (!report) return Response.json({ success: false, message: "Report not found" }, { status: 404 });
  const body = statusSchema.parse(await request.json());
  if (body.status === "SUBMITTED" && report.userId !== session.user.id) {
    return Response.json({ success: false, message: "Anda hanya dapat mengirim laporan milik sendiri" }, { status: 403 });
  }
  if (body.status === "APPROVED" || body.status === "REJECTED" || body.status === "REVISION") {
    if (!['ADMIN', 'MANAGER'].includes(role ?? "")) return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
  }
  const updated = await prisma.productionReport.update({ where: { id }, data: { status: body.status } });
  await prisma.activityLog.create({ data: { userId: session.user.id, action: `REPORT_${body.status}`, entityType: "ProductionReport", entityId: id, metadata: JSON.stringify({ previousStatus: report.status, status: body.status }) } });
  return Response.json({ success: true, data: updated });
}