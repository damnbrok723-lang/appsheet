import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateTeamSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  managerId: z.string().optional(),
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
    const team = await prisma.team.findUnique({
      where: { id },
      include: { department: true, users: true, manager: true, tasks: true, events: true, documents: true, announcements: true },
    });

    if (!team) {
      return NextResponse.json({ success: false, message: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Team retrieved successfully",
      data: team,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve team", error: (error as Error).message },
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
    const validated = updateTeamSchema.parse(body);

    const team = await prisma.team.update({
      where: { id },
      data: validated,
      include: { department: true, users: true, manager: true, tasks: true, events: true, documents: true, announcements: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "UPDATE",
        entityType: "Team",
        entityId: team.id,
        metadata: JSON.stringify(validated),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Team updated successfully",
      data: team,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to update team", error: (error as Error).message },
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

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return NextResponse.json({ success: false, message: "Team not found" }, { status: 404 });
    }

    await prisma.team.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "DELETE",
        entityType: "Team",
        entityId: id,
        metadata: JSON.stringify({ name: team.name }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully",
      data: null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete team", error: (error as Error).message },
      { status: 500 }
    );
  }
}
