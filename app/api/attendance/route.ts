import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";

const attendanceSchema = z.object({
  date: z.coerce.date().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const requestedUserId = searchParams.get("userId") || undefined;
    const role = (session.user as { role?: string }).role;
    const userId = ["ADMIN", "MANAGER"].includes(role ?? "") ? requestedUserId : session.user.id as string;
    const date = searchParams.get("date") ? new Date(searchParams.get("date")!) : undefined;

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (date) where.date = date;

    const [attendanceRecords, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: { user: true },
        skip,
        take: limit,
        orderBy: { date: "desc" },
      }),
      prisma.attendance.count({ where }),
    ]);

    return Response.json({
      success: true,
      message: "Attendance records retrieved successfully",
      data: { attendanceRecords, total, page, limit },
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to retrieve attendance records", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date } = attendanceSchema.parse(body);

    const attendanceDate = date || new Date();
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingRecord = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id as string,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    let attendance;

    if (!existingRecord) {
      attendance = await prisma.attendance.create({
        data: {
          userId: session.user.id as string,
          date: attendanceDate,
          checkIn: new Date(),
        },
        include: { user: true },
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id as string,
          action: "CHECK_IN",
          entityType: "Attendance",
          entityId: attendance.id,
          metadata: JSON.stringify({ date: attendanceDate }),
        },
      });

      return Response.json({
        success: true,
        message: "Check-in recorded successfully",
        data: attendance,
      });
    }

    if (!existingRecord.checkOut) {
      attendance = await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: { checkOut: new Date() },
        include: { user: true },
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id as string,
          action: "CHECK_OUT",
          entityType: "Attendance",
          entityId: attendance.id,
          metadata: JSON.stringify({ date: attendanceDate }),
        },
      });

      return Response.json({
        success: true,
        message: "Check-out recorded successfully",
        data: attendance,
      });
    }

    return Response.json({
      success: false,
      message: "Attendance record already complete for this date",
      data: existingRecord,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, message: "Validation error", error: error.issues },
        { status: 400 }
      );
    }
    return Response.json(
      { success: false, message: "Failed to record attendance", error: (error as Error).message },
      { status: 500 }
    );
  }
}
