import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).optional(),
  departmentId: z.string().optional(),
  teamId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
  permissions: z.array(z.string()).optional(),
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
    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id as string }, select: { id: true, role: true, departmentId: true, teamId: true } });
    const user = await prisma.user.findUnique({
      where: { id },
      include: { roleRef: true, department: true, team: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    const canRead = currentUser?.role === "ADMIN" || user.id === currentUser?.id || (currentUser?.role === "MANAGER" && (user.departmentId === currentUser.departmentId || user.teamId === currentUser.teamId));
    if (!canRead) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

    return NextResponse.json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve user", error: (error as Error).message },
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

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...validated,
        role: validated.role ?? undefined,
      },
      include: { roleRef: true, department: true, team: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        metadata: JSON.stringify(validated),
      },
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to update user", error: (error as Error).message },
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

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "DELETE",
        entityType: "User",
        entityId: id,
        metadata: JSON.stringify({ name: user.name, email: user.email }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
      data: null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete user", error: (error as Error).message },
      { status: 500 }
    );
  }
}
