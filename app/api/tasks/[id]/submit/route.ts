import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const submitSchema = z.object({});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    submitSchema.parse(await req.json());

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    if (task.status !== "IN_PROGRESS") {
      return NextResponse.json({ success: false, message: `Task cannot be submitted from status ${task.status}` }, { status: 400 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: "WAITING_REVIEW" },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "TASK_SUBMITTED",
        entityType: "Task",
        entityId: id,
        metadata: JSON.stringify({ previousStatus: "IN_PROGRESS", newStatus: "WAITING_REVIEW" }),
      },
    });

    return NextResponse.json({ success: true, message: "Task submitted for review", data: updatedTask });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
