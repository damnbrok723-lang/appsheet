import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";
import * as XLSX from "xlsx";

const monitoringSchema = z.object({
  date: z.coerce.date(),
  shift: z.enum(["SHIFT_1", "SHIFT_2", "SHIFT_3", "LONGSHIFT_1", "LONGSHIFT_2"]),
  operatorCount: z.coerce.number().int().min(0),
  warehouse: z.enum(["1", "5", "13"]),
  teamLeader: z.string().trim().min(1).max(120),
});

function parseDateValue(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  if (typeof value === "number") {
    const date = new Date((value - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) return date;
  }
  const str = String(value).trim();
  if (!str) return new Date();
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(date.getTime())) return date;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;
  return new Date();
}

function parseShift(value: unknown): "SHIFT_1" | "SHIFT_2" | "SHIFT_3" | "LONGSHIFT_1" | "LONGSHIFT_2" {
  const str = String(value ?? "").trim().toUpperCase().replace(/[\s_-]+/g, "");
  if (str.includes("LONG2") || str.includes("LS2")) return "LONGSHIFT_2";
  if (str.includes("LONG") || str.includes("LS1")) return "LONGSHIFT_1";
  if (str.includes("3") || str.includes("MALAM")) return "SHIFT_3";
  if (str.includes("2") || str.includes("SIANG")) return "SHIFT_2";
  return "SHIFT_1";
}

function parseWarehouse(value: unknown): "1" | "5" | "13" {
  const str = String(value ?? "").trim();
  if (str.includes("13")) return "13";
  if (str.includes("5")) return "5";
  return "1";
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, "").replace(/[^a-z0-9]/g, "");
}

async function importMonitoringExcel(request: Request, userId: string) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return Response.json({ success: false, message: "File Excel wajib dipilih" }, { status: 400 });

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheetName =
    workbook.SheetNames.find((name) => ["mp repair", "mprepair", "monitoring", "manpower"].includes(name.trim().toLowerCase())) ??
    workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return Response.json({ success: false, message: "Sheet Excel tidak ditemukan" }, { status: 400 });

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (!rows.length) return Response.json({ success: false, message: "File Excel tidak memiliki data" }, { status: 400 });

  const importedEntries: Array<{
    date: Date;
    shift: "SHIFT_1" | "SHIFT_2" | "SHIFT_3" | "LONGSHIFT_1" | "LONGSHIFT_2";
    operatorCount: number;
    warehouse: "1" | "5" | "13";
    teamLeader: string;
    userId: string;
  }> = [];

  for (const row of rows) {
    if (!Object.values(row).some((val) => String(val).trim() !== "")) continue;
    const normalized = Object.fromEntries(Object.entries(row).map(([k, v]) => [normalizeHeader(k), v]));

    const date = parseDateValue(normalized.tanggal || normalized.date || normalized.postdate);
    const operatorCount = Math.max(0, Number(normalized.jumlahoperator || normalized.operatorcount || normalized.totaloperator || normalized.operator || 0));
    const shift = parseShift(normalized.shift);
    const warehouse = parseWarehouse(normalized.gudang || normalized.warehouse || normalized.sloc);
    const teamLeader = String(normalized.kepalaregu || normalized.teamleader || normalized.leader || normalized.namaleader || "Team Leader").trim();

    importedEntries.push({
      date,
      shift,
      operatorCount,
      warehouse,
      teamLeader: teamLeader || "Team Leader",
      userId,
    });
  }

  if (importedEntries.length > 0) {
    await prisma.monitoringEntry.createMany({
      data: importedEntries,
    });
  }

  return Response.json({ success: true, data: { imported: importedEntries.length } }, { status: 201 });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  const entryWhere = role === "ADMIN" || role === "MANAGER" ? undefined : { userId: session.user.id as string };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthWhere = entryWhere ? { ...entryWhere, date: { gte: startOfMonth, lte: endOfMonth } } : { date: { gte: startOfMonth, lte: endOfMonth } };

  const [entries, entriesThisMonth, production] = await Promise.all([
    prisma.monitoringEntry.findMany({
      where: entryWhere,
      orderBy: { date: "desc" },
      take: 60,
      select: { id: true, date: true, shift: true, operatorCount: true, warehouse: true, teamLeader: true },
    }),
    prisma.monitoringEntry.findMany({
      where: monthWhere,
      select: { operatorCount: true, warehouse: true },
    }),
    prisma.productionReport.aggregate({ where: role === "ADMIN" || role === "MANAGER" ? undefined : { userId: session.user.id as string }, _sum: { qtyOk: true, qtyNg: true } }),
  ]);
  entries.reverse();
  const qtyOk = production._sum.qtyOk ?? 0;
  const qtyNg = production._sum.qtyNg ?? 0;
  const totalProduction = qtyOk + qtyNg;

  const totalMonthlyManpower = entriesThisMonth.reduce((t, e) => t + e.operatorCount, 0);
  const warehouseManpower = { "1": 0, "5": 0, "13": 0 } as Record<string, number>;
  for (const e of entriesThisMonth) { warehouseManpower[e.warehouse] = (warehouseManpower[e.warehouse] ?? 0) + e.operatorCount; }

  return Response.json({
    success: true,
    data: {
      entries,
      summary: {
        totalOperators: entries.reduce((total, entry) => total + entry.operatorCount, 0),
        qtyOk,
        qtyNg,
        okPercentage: totalProduction === 0 ? 0 : Math.round((qtyOk / totalProduction) * 1000) / 10,
        totalMonthlyManpower,
        warehouseManpower,
      },
    },
  }, { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

    if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      return importMonitoringExcel(request, session.user.id as string);
    }

    const data = monitoringSchema.parse(await request.json());
    const entry = await prisma.monitoringEntry.create({
      data: { ...data, userId: session.user.id as string },
    });
    return Response.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ success: false, message: "Validation error", errors: error.issues }, { status: 400 });
    return Response.json({ success: false, message: "Failed to save monitoring data" }, { status: 500 });
  }
}
