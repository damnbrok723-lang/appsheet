import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import type { ProductionReport } from "@prisma/client";
import { z } from "zod";
import * as XLSX from "xlsx";

const reportSchema = z.object({
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
  photoData: z.string().max(14_000_000, "Ukuran foto terlalu besar").optional(),
}).superRefine((data, context) => {
  if (data.qtyNg > 0 && !data.ncrNumber?.trim()) {
    context.addIssue({ code: "custom", path: ["ncrNumber"], message: "No NCR wajib diisi jika Qty NG lebih dari 0" });
  }
});

function textValue(value: unknown) {
  return String(value ?? "").trim();
}

function listValue(value: unknown, allowed: Record<string, string>) {
  return textValue(value).split(/[;,|]/).map((item) => allowed[item.trim().toUpperCase()] ?? "").filter(Boolean).slice(0, 1);
}

function shiftValue(value: unknown) {
  const normalized = textValue(value).toUpperCase().replace(/[\s-]+/g, "_");
  return ({ "1": "SHIFT_1", "2": "SHIFT_2", "3": "SHIFT_3", "LONG_1": "LONGSHIFT_1", "LONG_2": "LONGSHIFT_2" } as Record<string, string>)[normalized] ?? normalized;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, "").replace(/[^a-z0-9]/g, "");
}

async function importReports(request: Request, userId: string) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return Response.json({ success: false, message: "File Excel wajib dipilih" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return Response.json({ success: false, message: "Ukuran file maksimal 10 MB" }, { status: 400 });

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames.find((name) => ["mp repair", "laporan produksi"].includes(name.trim().toLowerCase())) ?? workbook.SheetNames.find((name) => name.trim().toLowerCase() === "repair") ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return Response.json({ success: false, message: "Sheet Excel tidak ditemukan" }, { status: 400 });
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (!rows.length) return Response.json({ success: false, message: "File Excel tidak memiliki data" }, { status: 400 });
  if (rows.length > 1000) return Response.json({ success: false, message: "Maksimal 1.000 baris per import" }, { status: 400 });

  const imported = rows.map((row, index) => {
    const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]));
    const data = {
      reportDate: normalized.tanggal || normalized.tanggalproduksi,
      customer: textValue(normalized.customer || normalized.pelanggan),
      dimensions: textValue(normalized.dimensi),
      pipeTypes: listValue(normalized.jenispipa, { KOTAK: "KOTAK", BULAT: "BULAT" }),
      batchNumber: textValue(normalized.batch || normalized.batchnumber || normalized.nomorbatch),
      ncrNumber: textValue(normalized.noncr || normalized.ncrnumber),
      operatorTypes: listValue(normalized.jenisoperator || normalized.tipeoperator, { BORONGAN: "BORONGAN", INTERNAL: "INTERNAL" }),
      operatorName: textValue(normalized.namaoperator || normalized.operator),
      shift: shiftValue(normalized.shift),
      qtyOk: Number(normalized.qtyok || normalized.ok),
      qtyNg: Number(normalized.qtyng || normalized.ng),
      ngNotes: textValue(normalized.keteranganng),
      processNotes: textValue(normalized.keteranganproses),
    };
    const result = reportSchema.safeParse(data);
    return { index: index + 2, result };
  });
  const invalid = imported.filter((row) => !row.result.success).map((row) => ({ row: row.index, errors: row.result.success ? [] : row.result.error.issues.map((issue) => issue.message) }));
  if (invalid.length) return Response.json({ success: false, message: `${invalid.length} baris tidak valid`, errors: invalid }, { status: 400 });

  const reports = imported.map((row) => (row.result.success ? row.result.data : null)).filter((row): row is z.infer<typeof reportSchema> => row !== null);
  await prisma.productionReport.createMany({ data: reports.map((report) => ({ ...report, pipeTypes: JSON.stringify(report.pipeTypes), operatorTypes: JSON.stringify(report.operatorTypes), userId, status: "DRAFT" })) });
  await prisma.activityLog.create({
    data: {
      userId,
      action: "EXCEL_IMPORTED",
      entityType: "ProductionReport",
      metadata: JSON.stringify({ fileName: file.name, totalRows: reports.length, successRows: reports.length, failedRows: 0 }),
    },
  });
  return Response.json({ success: true, data: { imported: reports.length } }, { status: 201 });
}

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
    if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      if ((session.user as { role?: string }).role !== "ADMIN") return Response.json({ success: false, message: "Import Excel hanya dapat dilakukan Admin" }, { status: 403 });
      return importReports(request, session.user.id as string);
    }

    const data = reportSchema.parse(await request.json());
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
