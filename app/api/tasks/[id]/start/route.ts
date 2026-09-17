import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const startSchema = z.object({});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    startSchema.parse(await req.json());

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    if (task.status !== "ACCEPTED") {
      return NextResponse.json({ success: false, message: `Task cannot be started from status ${task.status}` }, { status: 400 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: "IN_PROGRESS" },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "TASK_STARTED",
        entityType: "Task",
        entityId: id,
        metadata: JSON.stringify({ previousStatus: "ACCEPTED", newStatus: "IN_PROGRESS" }),
      },
    });

    return NextResponse.json({ success: true, message: "Task started", data: updatedTask });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
