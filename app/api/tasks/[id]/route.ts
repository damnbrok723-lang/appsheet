import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const TaskUpdateSchema = z.object({
  status: z.enum(["ASSIGNED", "ACCEPTED", "IN_PROGRESS", "WAITING_REVIEW", "REVISION", "BLOCKED", "APPROVED", "COMPLETED"]).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.coerce.date().optional(),
  assignedTo: z.string().optional(),
});

const validTransitions: Record<string, string[]> = {
  ASSIGNED: ["ACCEPTED"],
  ACCEPTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["WAITING_REVIEW"],
  WAITING_REVIEW: ["APPROVED", "REVISION", "BLOCKED"],
  REVISION: ["WAITING_REVIEW"],
  BLOCKED: ["IN_PROGRESS"],
  APPROVED: ["COMPLETED"],
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ success: false, message: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: true,
        assignedTo: true,
        team: true,
        comments: true,
        attachments: { include: { user: { select: { name: true } } } },
      },
    });

    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Task retrieved successfully",
      data: task,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve task", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 1];

    if (!id) {
      return NextResponse.json({ success: false, message: "Task ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const validated = TaskUpdateSchema.parse(body);

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    const currentUserId = session.user.id as string;
    const currentUserRole = (session.user as { role?: string }).role;
    if (existingTask.createdById !== currentUserId && existingTask.assignedToId !== currentUserId && !["ADMIN", "MANAGER"].includes(currentUserRole ?? "")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    if (validated.status && existingTask.status !== validated.status) {
      const allowedTransitions = validTransitions[existingTask.status];
      if (!allowedTransitions?.includes(validated.status)) {
        return NextResponse.json(
          { success: false, message: `Invalid status transition from ${existingTask.status} to ${validated.status}` },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.status !== undefined && { status: validated.status }),
        ...(validated.priority !== undefined && { priority: validated.priority }),
        ...(validated.dueDate !== undefined && { dueDate: validated.dueDate }),
        ...(validated.assignedTo !== undefined && { assignedTo: { connect: { id: validated.assignedTo } } }),
      },
      include: {
        createdBy: true,
        assignedTo: true,
        team: true,
        comments: true,
        attachments: { include: { user: { select: { name: true } } } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: validated.status ? "UPDATE_STATUS" : "UPDATE",
        entityType: "Task",
        entityId: task.id,
        metadata: JSON.stringify({
          ...(validated.status && { status: validated.status }),
          ...(validated.title && { title: validated.title }),
          ...(validated.priority && { priority: validated.priority }),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
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
      { success: false, message: "Failed to update task", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 1];

    if (!id) {
      return NextResponse.json({ success: false, message: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    const currentUserId = session.user.id as string;
    const currentUserRole = (session.user as { role?: string }).role;
    if (task.createdById !== currentUserId && task.assignedToId !== currentUserId && !["ADMIN", "MANAGER"].includes(currentUserRole ?? "")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "DELETE",
        entityType: "Task",
        entityId: id,
        metadata: JSON.stringify({ title: task.title }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
      data: null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete task", error: (error as Error).message },
      { status: 500 }
    );
  }
}
