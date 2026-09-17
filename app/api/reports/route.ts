import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";

const reportSchema = z.object({
  type: z.enum(["task", "attendance", "user", "department"]),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || undefined;
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;

    const { type: reportType, startDate: sd, endDate: ed } = reportSchema.parse({ type, startDate, endDate });

    const where: Record<string, unknown> = {};
    if (sd && ed) {
      where.createdAt = { gte: sd, lte: ed };
    } else if (sd) {
      where.createdAt = { gte: sd };
    } else if (ed) {
      where.createdAt = { lte: ed };
    }

    let report: unknown;

    switch (reportType) {
      case "task": {
        const [byStatus, total] = await Promise.all([
          prisma.task.groupBy({
            by: ["status"],
            where,
            _count: { id: true },
          }),
          prisma.task.count({ where }),
        ]);
        report = { tasksByStatus: byStatus, total };
        break;
      }
      case "attendance": {
        const [checkIns, checkOuts] = await Promise.all([
          prisma.attendance.count({ where: { checkIn: { not: null }, ...where } }),
          prisma.attendance.count({ where: { checkOut: { not: null }, ...where } }),
        ]);
        report = { checkIns, checkOuts };
        break;
      }
      case "user": {
        const [byRole, byDepartment] = await Promise.all([
          prisma.user.groupBy({
            by: ["role"],
            where,
            _count: { id: true },
          }),
          prisma.user.groupBy({
            by: ["departmentId"],
            where,
            _count: { id: true },
          }),
        ]);
        report = { usersByRole: byRole, usersByDepartment: byDepartment };
        break;
      }
      case "department": {
        const departments = await prisma.department.findMany({
          where,
          include: {
            _count: { select: { users: true, teams: true } },
          },
        });
        report = {
          departments: departments.map((d) => ({
            ...d,
            userCount: d._count.users,
            teamCount: d._count.teams,
          })),
        };
        break;
      }
      default:
        return Response.json(
          { success: false, message: "Invalid report type" },
          { status: 400 }
        );
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "GENERATE_REPORT",
        entityType: "Report",
        metadata: JSON.stringify({ type: reportType, startDate: sd, endDate: ed }),
      },
    });

    return Response.json({
      success: true,
      message: "Report generated successfully",
      data: { report },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, message: "Validation error", error: error.issues },
        { status: 400 }
      );
    }
    return Response.json(
      { success: false, message: "Failed to generate report", error: (error as Error).message },
      { status: 500 }
    );
  }
}
