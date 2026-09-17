import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const attendanceId = url.searchParams.get("id");

    if (!attendanceId) {
      return Response.json(
        { success: false, message: "Attendance ID is required" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.findFirst({
      where: { id: attendanceId },
      include: { user: true },
    });

    if (!attendance) {
      return Response.json(
        { success: false, message: "Attendance record not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Attendance record retrieved successfully",
      data: attendance,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to retrieve attendance record", error: (error as Error).message },
      { status: 500 }
    );
  }
}
