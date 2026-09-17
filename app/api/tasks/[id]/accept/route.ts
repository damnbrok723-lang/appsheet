import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const acceptSchema = z.object({});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    acceptSchema.parse(await req.json());

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    if (task.status !== "ASSIGNED") {
      return NextResponse.json({ success: false, message: `Task cannot be accepted from status ${task.status}` }, { status: 400 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: "ACCEPTED" },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "TASK_ACCEPTED",
        entityType: "Task",
        entityId: id,
        metadata: JSON.stringify({ previousStatus: "ASSIGNED", newStatus: "ACCEPTED" }),
      },
    });

    return NextResponse.json({ success: true, message: "Task accepted", data: updatedTask });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
