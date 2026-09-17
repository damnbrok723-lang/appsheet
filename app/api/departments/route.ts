import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createDepartmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const departments = await prisma.department.findMany({
      include: { users: true, teams: true },
    });

    return NextResponse.json({
      success: true,
      message: "Departments retrieved successfully",
      data: departments,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve departments", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { roleRef: true },
    });

    if (!currentUser || !["ADMIN", "MANAGER"].includes(currentUser.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createDepartmentSchema.parse(body);

    const department = await prisma.department.create({
      data: validated,
      include: { users: true, teams: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "CREATE",
        entityType: "Department",
        entityId: department.id,
        metadata: JSON.stringify({ name: department.name }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to create department", error: (error as Error).message },
      { status: 500 }
    );
  }
}
