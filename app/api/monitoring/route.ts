import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";

const monitoringSchema = z.object({
  date: z.coerce.date(),
  shift: z.enum(["SHIFT_1", "SHIFT_2", "SHIFT_3", "LONGSHIFT_1", "LONGSHIFT_2"]),
  operatorCount: z.coerce.number().int().min(0),
  warehouse: z.enum(["1", "5", "13"]),
  teamLeader: z.string().trim().min(1).max(120),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  const entryWhere = role === "ADMIN" || role === "MANAGER" ? undefined : { userId: session.user.id as string };

  const [entries, production] = await Promise.all([
    prisma.monitoringEntry.findMany({
      where: entryWhere,
      orderBy: { date: "desc" },
      take: 30,
      select: { id: true, date: true, shift: true, operatorCount: true, warehouse: true, teamLeader: true },
    }),
    prisma.productionReport.aggregate({ where: role === "ADMIN" || role === "MANAGER" ? undefined : { userId: session.user.id as string }, _sum: { qtyOk: true, qtyNg: true } }),
  ]);
  entries.reverse();
  const qtyOk = production._sum.qtyOk ?? 0;
  const qtyNg = production._sum.qtyNg ?? 0;
  const totalProduction = qtyOk + qtyNg;
  return Response.json({
    success: true,
    data: {
      entries,
      summary: {
        totalOperators: entries.reduce((total, entry) => total + entry.operatorCount, 0),
        qtyOk,
        qtyNg,
        okPercentage: totalProduction === 0 ? 0 : Math.round((qtyOk / totalProduction) * 1000) / 10,
      },
    },
  }, { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

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
