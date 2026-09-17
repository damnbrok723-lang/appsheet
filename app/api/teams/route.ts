import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createTeamSchema = z.object({
  name: z.string().min(1),
  departmentId: z.string(),
  description: z.string().optional(),
  managerId: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const teams = await prisma.team.findMany({
      include: { department: true, users: true, manager: true },
    });

    return NextResponse.json({
      success: true,
      message: "Teams retrieved successfully",
      data: teams,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve teams", error: (error as Error).message },
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
    const validated = createTeamSchema.parse(body);

    const team = await prisma.team.create({
      data: validated,
      include: { department: true, users: true, manager: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "CREATE",
        entityType: "Team",
        entityId: team.id,
        metadata: JSON.stringify({ name: team.name, departmentId: team.departmentId }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Team created successfully",
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
      { success: false, message: "Failed to create team", error: (error as Error).message },
      { status: 500 }
    );
  }
}
