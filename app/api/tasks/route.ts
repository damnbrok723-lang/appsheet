import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const TaskCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  teamId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.coerce.date().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedTo = searchParams.get("assignedTo");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedToId = assignedTo;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        skip,
        take: limit,
        where,
        include: {
          createdBy: true,
          assignedTo: true,
          team: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Tasks retrieved successfully",
      data: { tasks, total, page, limit },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve tasks", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = TaskCreateSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        title: validated.title,
        description: validated.description,
        assignedToId: validated.assignedTo,
        teamId: validated.teamId,
        priority: validated.priority,
        dueDate: validated.dueDate,
        createdById: session.user.id as string,
      },
      include: {
        createdBy: true,
        assignedTo: true,
        team: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "CREATE",
        entityType: "Task",
        entityId: task.id,
        metadata: JSON.stringify({ title: task.title, priority: task.priority }),
      },
    });

    if (validated.assignedTo) {
      await prisma.notification.create({
        data: {
          userId: validated.assignedTo,
          type: "TASK_ASSIGNED",
          title: "New Task Assigned",
          message: `You have been assigned to task: ${task.title}`,
          entityType: "Task",
          entityId: task.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to create task", error: (error as Error).message },
      { status: 500 }
    );
  }
}
