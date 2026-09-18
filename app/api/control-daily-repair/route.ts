import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";

type ProductionImportRow = Omit<Prisma.ProductionReportUncheckedCreateInput, "userId"> & { sourceKey: string };
type MonitoringImportRow = Omit<Prisma.MonitoringEntryUncheckedCreateInput, "userId"> & { sourceKey: string };

function textValue(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, "").replace(/[^a-z0-9]/g, "");
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const normalized = textValue(value).replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDateValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const date = new Date((value - 25569) * 86400 * 1000);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const raw = textValue(value);
  const dmy = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function warehouseValue(value: unknown) {
  const raw = textValue(value);
  const match = raw.match(/\d+/);
  return match ? `Gd ${Number(match[0])}` : raw || "Tanpa Gudang";
}

function shiftValue(value: unknown) {
  const raw = textValue(value).toUpperCase().replace(/[\s_-]+/g, "");
  if (raw.includes("LONG2") || raw.includes("LS2")) return "LONGSHIFT_2";
  if (raw.includes("LONG") || raw.includes("LS1")) return "LONGSHIFT_1";
  if (raw.includes("3") || raw.includes("MALAM")) return "SHIFT_3";
  if (raw.includes("2") || raw.includes("SIANG")) return "SHIFT_2";
  return "SHIFT_1";
}

function rowValues(sheet: XLSX.WorkSheet) {
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
    .filter((row) => Object.values(row).some((value) => textValue(value) !== ""))
    .map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])));
}

function findSheet(workbook: XLSX.WorkBook, names: string[]) {
  return workbook.SheetNames.find((name) => names.includes(name.trim().toLowerCase()));
}

function stableKey(parts: unknown[]) {
  return parts.map((part) => textValue(part).toUpperCase()).join("|");
}

function uniqueRows<T extends { sourceKey: string }>(rows: T[]) {
  return [...new Map(rows.map((row) => [row.sourceKey, row])).values()];
}

async function syncProductionRows(rows: ProductionImportRow[], userId: string, sourceType: string) {
  const unique = uniqueRows(rows);
  const existing = await prisma.productionReport.findMany({
    where: { userId, sourceType, sourceKey: { in: unique.map((row) => row.sourceKey) } },
    select: { id: true, sourceKey: true },
  });
  const existingIds = existing.map((row) => row.id);
  const operations: Prisma.PrismaPromise<unknown>[] = [];
  if (existingIds.length) operations.push(prisma.productionReport.deleteMany({ where: { id: { in: existingIds } } }));
  operations.push(prisma.productionReport.createMany({ data: unique.map((row) => ({ ...row, userId })) }));
  await prisma.$transaction(operations);
  return unique.length;
}

async function syncMonitoringRows(rows: MonitoringImportRow[], userId: string) {
  const unique = uniqueRows(rows);
  const existing = await prisma.monitoringEntry.findMany({
    where: { userId, sourceKey: { in: unique.map((row) => row.sourceKey) } },
    select: { id: true, sourceKey: true },
  });
  const existingIds = existing.map((row) => row.id);
  const operations: Prisma.PrismaPromise<unknown>[] = [];
  if (existingIds.length) operations.push(prisma.monitoringEntry.deleteMany({ where: { id: { in: existingIds } } }));
  operations.push(prisma.monitoringEntry.createMany({ data: unique.map((row) => ({ ...row, userId })) }));
  await prisma.$transaction(operations);
  return unique.length;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return Response.json({ success: false, message: "File Control Daily Repair wajib dipilih" }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return Response.json({ success: false, message: "Ukuran file maksimal 20 MB" }, { status: 400 });

    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    let stockSheet = workbook.Sheets[findSheet(workbook, ["stok grade c", "stok grade", "stok ncr"]) ?? ""];
    let repairSheet = workbook.Sheets[findSheet(workbook, ["repair", "output repair"]) ?? ""];
    let manpowerSheet = workbook.Sheets[findSheet(workbook, ["mp repair", "mprepair", "monitoring"]) ?? ""];
    const firstSheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
    const firstRows = firstSheet ? rowValues(firstSheet) : [];
    if (firstRows.length && !stockSheet && !repairSheet && !manpowerSheet) {
      if (firstRows.some((row) => "unrestrictedpcs" in row || "unrestrictedkg" in row)) stockSheet = firstSheet;
      else if (firstRows.some((row) => "qtypcs" in row || "tonasekg" in row)) repairSheet = firstSheet;
      else if (firstRows.some((row) => "jumlahoperator" in row || "operatorcount" in row)) manpowerSheet = firstSheet;
    }

    if (!stockSheet && !repairSheet && !manpowerSheet) {
      return Response.json({ success: false, message: "Sheet Stok Grade C, Repair, atau MP repair tidak ditemukan" }, { status: 400 });
    }

    const userId = session.user.id as string;
    let stockImported = 0;
    let repairImported = 0;
    let manpowerImported = 0;

    if (stockSheet) {
      const rows = rowValues(stockSheet);
      const data = rows.map((row, index) => {
        const batch = textValue(row.batch || `STOCK-${index + 1}`);
        const qtyNg = Math.max(0, Math.round(numberValue(row.unrestrictedpcs)));
        return {
          sourceKey: stableKey(["STOCK", row.sloc, row.materialnumber, batch]),
          reportDate: parseDateValue(row.requesteddelivdate),
          customer: textValue(row.customer) || "Customer Umum",
          dimensions: `${textValue(row.diammm || "-")} x ${textValue(row.tebal || "-")} x ${textValue(row.panjang || "-")}`,
          pipeTypes: JSON.stringify(["KOTAK"]),
          batchNumber: batch,
          ncrNumber: qtyNg > 0 ? `NCR-${batch}` : null,
          operatorTypes: JSON.stringify(["INTERNAL"]),
          operatorName: "SAP Stock",
          shift: "SHIFT_1",
          qtyOk: 0,
          qtyNg,
          ngNotes: textValue(row.custremark) || null,
          processNotes: "Import Control Daily Repair - Stok Grade C",
          sourceType: "STOCK",
          warehouse: warehouseValue(row.gudang || row.sloc),
          tonnageKg: Math.max(0, numberValue(row.unrestrictedkg)),
          stockGrade: textValue(row.grade) || null,
          stockType: textValue(row.stlt) || null,
          status: "DRAFT",
        };
      });
      if (data.length) {
        stockImported = await syncProductionRows(data, userId, "STOCK");
      }
    }

    if (repairSheet) {
      const rows = rowValues(repairSheet);
      const data = rows.map((row, index) => ({
        sourceKey: stableKey(["REPAIR", row.order, row.materialdoc, row.batch, row.mvt, row.postdate, row.sloc]),
        reportDate: parseDateValue(row.postdate || row.docdate),
        customer: textValue(row.name) || "Customer Umum",
        dimensions: `${textValue(row.diamm || "-")} x ${textValue(row.tebal || "-")} x ${textValue(row.panjang || "-")}`,
        pipeTypes: JSON.stringify(["KOTAK"]),
        batchNumber: textValue(row.batch || `REPAIR-${index + 1}`),
        ncrNumber: null,
        operatorTypes: JSON.stringify(["INTERNAL"]),
        operatorName: textValue(row.username) || "SAP Repair",
        shift: shiftValue(row.stlt),
        qtyOk: Math.max(0, Math.round(numberValue(row.qtypcs))),
        qtyNg: 0,
        ngNotes: textValue(row.remark) || null,
        processNotes: "Import Control Daily Repair - Repair",
        sourceType: "OUTPUT_REPAIR",
        warehouse: warehouseValue(row.gudang || row.sloc),
        tonnageKg: Math.max(0, numberValue(row.tonasekg)),
        stockGrade: null,
        stockType: textValue(row.stlt) || null,
        status: "DRAFT",
      }));
      if (data.length) {
        repairImported = await syncProductionRows(data, userId, "OUTPUT_REPAIR");
      }
    }

    if (manpowerSheet) {
      const rows = rowValues(manpowerSheet);
      const data = rows.map((row) => ({
        sourceKey: stableKey(["MP", row.tanggal || row.date, row.shift, row.gudang || row.warehouse]),
        date: parseDateValue(row.tanggal || row.date),
        shift: shiftValue(row.shift),
        operatorCount: Math.max(0, Math.round(numberValue(row.jumlahoperator || row.operatorcount))),
        warehouse: warehouseValue(row.gudang || row.warehouse).replace("Gd ", ""),
        teamLeader: textValue(row.kepalaregu || row.teamleader) || "SAP Import",
      }));
      if (data.length) {
        manpowerImported = await syncMonitoringRows(data, userId);
      }
    }

    return Response.json({
      success: true,
      data: { stockImported, repairImported, manpowerImported },
    }, { status: 201 });
  } catch {
    return Response.json({ success: false, message: "Gagal mengimpor Control Daily Repair" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session?.user?.id) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id as string;
  const [reports, monitoring] = await prisma.$transaction([
    prisma.productionReport.deleteMany({ where: { userId, sourceType: { in: ["STOCK", "OUTPUT_REPAIR"] }, sourceKey: { not: null } } }),
    prisma.monitoringEntry.deleteMany({ where: { userId, sourceKey: { not: null } } }),
  ]);

  return Response.json({ success: true, data: { reportsDeleted: reports.count, monitoringDeleted: monitoring.count } });
}
