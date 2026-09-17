import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateDepartmentSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const department = await prisma.department.findUnique({
      where: { id },
      include: { users: true, teams: true },
    });

    if (!department) {
      return NextResponse.json({ success: false, message: "Department not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Department retrieved successfully",
      data: department,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve department", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { roleRef: true },
    });

    if (!currentUser || !["ADMIN", "MANAGER"].includes(currentUser.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateDepartmentSchema.parse(body);

    const department = await prisma.department.update({
      where: { id },
      data: validated,
      include: { users: true, teams: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "UPDATE",
        entityType: "Department",
        entityId: department.id,
        metadata: JSON.stringify(validated),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Department updated successfully",
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
      { success: false, message: "Failed to update department", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { roleRef: true },
    });

    if (!currentUser || !["ADMIN", "MANAGER"].includes(currentUser.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      return NextResponse.json({ success: false, message: "Department not found" }, { status: 404 });
    }

    await prisma.department.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "DELETE",
        entityType: "Department",
        entityId: id,
        metadata: JSON.stringify({ name: department.name }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Department deleted successfully",
      data: null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete department", error: (error as Error).message },
      { status: 500 }
    );
  }
}
