import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { downloadStorageFile } from "@/lib/storage";
import type { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";

export const maxDuration = 60;

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
  const raw = textValue(value).replace(/\s/g, "");
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  const normalized = hasComma && hasDot
    ? raw.lastIndexOf(",") > raw.lastIndexOf(".")
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw.replace(/,/g, "")
    : hasComma
      ? /^-?\d{1,3}(,\d{3})+$/.test(raw) ? raw.replace(/,/g, "") : raw.replace(",", ".")
      : hasDot
        ? /^-?\d{1,3}(\.\d{3})+$/.test(raw) ? raw.replace(/\./g, "") : raw
        : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDateValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
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
  return [...new Map(rows.map((row, index) => [row.sourceKey || `ROW-${index + 1}`, row])).values()];
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
  operations.push(prisma.productionReport.createMany({
    data: unique.map((row) => ({
      userId,
      sourceKey: row.sourceKey,
      reportDate: row.reportDate,
      customer: row.customer,
      dimensions: row.dimensions,
      pipeTypes: row.pipeTypes,
      batchNumber: row.batchNumber,
      ncrNumber: row.ncrNumber,
      operatorTypes: row.operatorTypes,
      operatorName: row.operatorName,
      shift: row.shift,
      qtyOk: row.qtyOk,
      qtyNg: row.qtyNg,
      ngNotes: row.ngNotes,
      processNotes: row.processNotes,
      sourceType: row.sourceType,
      warehouse: row.warehouse,
      tonnageKg: row.tonnageKg,
      grQtyPcs: row.grQtyPcs,
      giQtyPcs: row.giQtyPcs,
      grBaseUnit: row.grBaseUnit,
      giBaseUnit: row.giBaseUnit,
      stockGrade: row.stockGrade,
      stockType: row.stockType,
      status: row.status,
    })),
  }));
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

    const contentType = request.headers.get("content-type") || "";
    let workbookBuffer: ArrayBuffer;
    let requestedSheet = "";

    if (contentType.includes("application/json")) {
      const body = await request.json() as { path?: string; sheetHint?: string };
      const expectedPrefix = `${session.user.id}/imports/`;
      if (!body.path || !body.path.startsWith(expectedPrefix)) {
        return Response.json({ success: false, message: "Import file path tidak valid" }, { status: 400 });
      }
      const storedFile = await downloadStorageFile(body.path);
      workbookBuffer = await storedFile.arrayBuffer();
      requestedSheet = textValue(body.sheetHint).toLowerCase();
    } else {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) return Response.json({ success: false, message: "File Control Daily Repair wajib dipilih" }, { status: 400 });
      workbookBuffer = await file.arrayBuffer();
      requestedSheet = textValue(formData.get("sheetHint")).toLowerCase();
    }

    const workbook = XLSX.read(workbookBuffer, { type: "array", cellDates: true });
    let stockSheet: XLSX.WorkSheet | undefined = workbook.Sheets[findSheet(workbook, ["stok grade c", "stok grade", "stok ncr"]) ?? ""];
    let repairSheet: XLSX.WorkSheet | undefined = workbook.Sheets[findSheet(workbook, ["repair", "output repair"]) ?? ""];
    let manpowerSheet: XLSX.WorkSheet | undefined = workbook.Sheets[findSheet(workbook, ["mp repair", "mprepair", "monitoring"]) ?? ""];
    if (requestedSheet) {
      stockSheet = requestedSheet.includes("stok") ? stockSheet : undefined;
      repairSheet = requestedSheet.includes("repair") && !requestedSheet.includes("mp") ? repairSheet : undefined;
      manpowerSheet = requestedSheet.includes("mp") || requestedSheet.includes("monitoring") ? manpowerSheet : undefined;
    }
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
      const data = rows.filter((row) => textValue(row.sloc || row.materialnumber || row.batch)).map((row, index) => {
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
      const data = rows.filter((row) => textValue(row.order || row.materialdoc || row.batch)).map((row, index) => {
        const qtyPcs = Math.max(0, Math.round(numberValue(row.qtypcs)));
        const tonnage = Math.max(0, numberValue(row.tonasekg));

        const grQtyPcsRaw = numberValue(row.grqtypcs || row.grqty);
        const giQtyPcsRaw = numberValue(row.giqtypcs || row.giqty);
        const grBaseUnitRaw = numberValue(row.grbaseunit || row.grtonase || row.grkg);
        const giBaseUnitRaw = numberValue(row.gibaseunit || row.gitonase || row.gikg);
        const mvt = textValue(row.mvt).toUpperCase();
        const isGI = mvt.includes("GI") || ["102", "261", "562", "502", "201"].includes(mvt);
        const isGR = mvt.includes("GR") || ["101", "262", "561", "501", "309"].includes(mvt);

        const hasGRField = "grqtypcs" in row || "grqty" in row;
        const hasGIField = "giqtypcs" in row || "giqty" in row;

        const grQtyPcs = hasGRField ? grQtyPcsRaw : isGI ? 0 : qtyPcs;
        const giQtyPcs = hasGIField ? giQtyPcsRaw : isGR ? 0 : isGI ? qtyPcs : Math.round(qtyPcs * 0.95);
        const hasGRBaseField = "grbaseunit" in row || "grtonase" in row || "grkg" in row;
        const hasGIBaseField = "gibaseunit" in row || "gitonase" in row || "gikg" in row;
        const grBaseUnit = hasGRBaseField ? grBaseUnitRaw : isGI ? 0 : tonnage;
        const giBaseUnit = hasGIBaseField ? giBaseUnitRaw : isGR ? 0 : isGI ? tonnage : tonnage * 0.95;

        return {
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
          qtyOk: qtyPcs,
          qtyNg: 0,
          ngNotes: textValue(row.remark) || null,
          processNotes: "Import Control Daily Repair - Repair",
          sourceType: "OUTPUT_REPAIR",
          warehouse: warehouseValue(row.gudang || row.sloc),
          tonnageKg: tonnage,
          grQtyPcs,
          giQtyPcs,
          grBaseUnit,
          giBaseUnit,
          stockGrade: null,
          stockType: textValue(row.stlt) || null,
          status: "DRAFT",
        };
      });
      if (data.length) {
        repairImported = await syncProductionRows(data, userId, "OUTPUT_REPAIR");
      }
    }

    if (manpowerSheet) {
      const rows = rowValues(manpowerSheet);
      const data = rows.filter((row) => textValue(row.tanggal || row.date) && textValue(row.gudang || row.warehouse)).map((row) => ({
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
  } catch (error) {
    console.error("Control Daily Repair import failed", error);
    const message = error instanceof Error ? error.message : "Gagal mengimpor Control Daily Repair";
    return Response.json({ success: false, message: `Gagal mengimpor Control Daily Repair: ${message.slice(0, 240)}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id as string;
  const outputRepairOnly = new URL(request.url).searchParams.get("scope") === "output-repair";
  const [reports, monitoring] = await prisma.$transaction([
    prisma.productionReport.deleteMany({
      where: { userId, sourceType: outputRepairOnly ? "OUTPUT_REPAIR" : { in: ["STOCK", "OUTPUT_REPAIR"] }, sourceKey: { not: null } },
    }),
    outputRepairOnly
      ? prisma.monitoringEntry.deleteMany({ where: { id: "__output-repair-noop__" } })
      : prisma.monitoringEntry.deleteMany({ where: { userId, sourceKey: { not: null } } }),
  ]);

  return Response.json({ success: true, data: { reportsDeleted: reports.count, monitoringDeleted: monitoring.count } });
}
