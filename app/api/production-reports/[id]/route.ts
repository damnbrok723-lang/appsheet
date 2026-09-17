import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";

const updateReportSchema = z.object({
  reportDate: z.coerce.date(),
  customer: z.string().trim().min(1).max(160),
  dimensions: z.string().trim().min(1).max(160),
  pipeTypes: z.array(z.enum(["KOTAK", "BULAT"])).min(1),
  batchNumber: z.string().trim().min(1).max(120),
  ncrNumber: z.string().trim().max(120).optional(),
  operatorTypes: z.array(z.enum(["BORONGAN", "INTERNAL"])).min(1),
  operatorName: z.string().trim().min(1).max(160),
  shift: z.enum(["SHIFT_1", "SHIFT_2", "SHIFT_3", "LONGSHIFT_1", "LONGSHIFT_2", "PAGI", "SIANG", "MALAM"]),
  qtyOk: z.coerce.number().int().min(0),
  qtyNg: z.coerce.number().int().min(0),
  ngNotes: z.string().trim().max(2000).optional(),
  processNotes: z.string().trim().max(2000).optional(),
  photoData: z.string().max(14_000_000).optional(),
}).superRefine((data, context) => {
  if (data.qtyNg > 0 && !data.ncrNumber?.trim()) {
    context.addIssue({ code: "custom", path: ["ncrNumber"], message: "No NCR wajib diisi jika Qty NG lebih dari 0" });
  }
});

function serializeReport(report: { pipeTypes: string; operatorTypes: string; [key: string]: unknown }) {
  return { ...report, pipeTypes: JSON.parse(report.pipeTypes), operatorTypes: JSON.parse(report.operatorTypes) };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const report = await prisma.productionReport.findUnique({ where: { id } });
  if (!report) return Response.json({ success: false, message: "Report not found" }, { status: 404 });
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "MANAGER" && report.userId !== session.user.id) return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
  return Response.json({ success: true, data: serializeReport(report) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const existing = await prisma.productionReport.findUnique({ where: { id } });
    if (!existing) return Response.json({ success: false, message: "Report not found" }, { status: 404 });
    const role = (session.user as { role?: string }).role;
    if (role !== "ADMIN" && existing.userId !== session.user.id) return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
    if (role !== "ADMIN" && !["DRAFT", "REVISION"].includes(existing.status)) return Response.json({ success: false, message: "Hanya laporan Draft atau Revision yang dapat diedit" }, { status: 409 });

    const data = updateReportSchema.parse(await request.json());
    const updated = await prisma.productionReport.update({
      where: { id },
      data: { ...data, pipeTypes: JSON.stringify(data.pipeTypes), operatorTypes: JSON.stringify(data.operatorTypes) },
    });
    await prisma.activityLog.create({ data: { userId: session.user.id as string, action: "UPDATE", entityType: "ProductionReport", entityId: id, metadata: JSON.stringify({ status: existing.status }) } });
    return Response.json({ success: true, data: serializeReport(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ success: false, message: `Validation error: ${error.issues.map((issue) => `${issue.path.join(".") || "form"} - ${issue.message}`).join("; ")}`, errors: error.issues }, { status: 400 });
    return Response.json({ success: false, message: "Failed to update production report" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.productionReport.findUnique({ where: { id } });
  if (!existing) return Response.json({ success: false, message: "Report not found" }, { status: 404 });
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && existing.userId !== session.user.id) return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
  if (role !== "ADMIN" && existing.status !== "DRAFT") return Response.json({ success: false, message: "Hanya laporan Draft yang dapat dihapus" }, { status: 409 });

  await prisma.productionReport.delete({ where: { id } });
  await prisma.activityLog.create({ data: { userId: session.user.id as string, action: "DELETE", entityType: "ProductionReport", entityId: id, metadata: JSON.stringify({ status: existing.status }) } });
  return Response.json({ success: true, data: null });
}
