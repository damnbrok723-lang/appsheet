import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const commentSchema = z.object({
  comment: z.string().min(1),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    const comments = await prisma.taskComment.findMany({
      where: { taskId: id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, message: "Comments retrieved", data: comments });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = commentSchema.parse(body);

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        userId: session.user.id as string,
        comment: validated.comment,
      },
      include: { user: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "COMMENT_CREATED",
        entityType: "TaskComment",
        entityId: id,
        metadata: JSON.stringify({ comment: validated.comment }),
      },
    });

    return NextResponse.json({ success: true, message: "Comment added", data: comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
