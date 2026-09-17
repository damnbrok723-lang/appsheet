import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import type { ProductionReport } from "@prisma/client";
import { z } from "zod";

const reportSchema = z.object({
  reportDate: z.coerce.date(),
  customer: z.string().trim().min(1).max(160),
  dimensions: z.string().trim().min(1).max(160),
  pipeTypes: z.array(z.enum(["KOTAK", "BULAT"])).min(1),
  batchNumber: z.string().trim().min(1).max(120),
  ncrNumber: z.string().trim().max(120).optional(),
  operatorTypes: z.array(z.enum(["BORONGAN", "INTERNAL"])).min(1),
  operatorName: z.string().trim().min(1).max(160),
  shift: z.enum(["PAGI", "SIANG", "MALAM"]),
  qtyOk: z.coerce.number().int().min(0),
  qtyNg: z.coerce.number().int().min(0),
  ngNotes: z.string().trim().max(2000).optional(),
  processNotes: z.string().trim().max(2000).optional(),
  photoData: z.string().max(14_000_000, "Ukuran foto terlalu besar").optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  const reports = await prisma.productionReport.findMany({
    where: role === "ADMIN" || role === "MANAGER" ? undefined : { userId: session.user.id as string },
    orderBy: { reportDate: "desc" },
    take: 100,
  });
  return Response.json({
    success: true,
    data: { reports: reports.map((report: ProductionReport) => ({ ...report, pipeTypes: JSON.parse(report.pipeTypes), operatorTypes: JSON.parse(report.operatorTypes) })) },
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const data = reportSchema.parse(await request.json());
      if (data.qtyNg > 0 && !data.ncrNumber?.trim()) {
        return Response.json({ success: false, message: "No NCR wajib diisi jika Qty NG lebih dari 0" }, { status: 400 });
      }
    const report = await prisma.productionReport.create({
      data: {
        ...data,
        pipeTypes: JSON.stringify(data.pipeTypes),
        operatorTypes: JSON.stringify(data.operatorTypes),
        userId: session.user.id as string,
        status: "DRAFT",
      },
    });
    return Response.json({ success: true, data: report }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ success: false, message: "Validation error", errors: error.issues }, { status: 400 });
    return Response.json({ success: false, message: "Failed to save production report" }, { status: 500 });
  }
}
