import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: session.user.id as string },
      include: { user: true },
    });

    if (!notification) {
      return NextResponse.json({ success: false, message: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Notification retrieved successfully",
      data: notification,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to retrieve notification", error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: session.user.id as string },
    });

    if (!notification) {
      return NextResponse.json({ success: false, message: "Notification not found" }, { status: 404 });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "MARK_NOTIFICATION_READ",
        entityType: "Notification",
        entityId: id,
        metadata: JSON.stringify({ notificationId: id }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
      data: updatedNotification,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Validation error", error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Failed to mark notification as read", error: (error as Error).message }, { status: 500 });
  }
}
