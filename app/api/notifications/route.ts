import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";

const readNotificationsSchema = z.object({
  notificationIds: z.array(z.string()),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const read = searchParams.get("read") === "true";

    const skip = (page - 1) * limit;

    const where = {
      userId: session.user.id as string,
      ...(read !== undefined ? { readAt: read ? { not: null } : null } : {}),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: { user: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);

    return Response.json({
      success: true,
      message: "Notifications retrieved successfully",
      data: { notifications, total, page, limit },
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to retrieve notifications", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action || "read";

    if (action === "read-all") {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id as string,
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id as string,
          action: "MARK_ALL_NOTIFICATIONS_READ",
          entityType: "Notification",
          metadata: JSON.stringify({ action: "readAll" }),
        },
      });

      return Response.json({
        success: true,
        message: "All notifications marked as read",
        data: null,
      });
    }

    const { notificationIds } = readNotificationsSchema.parse(body);

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.user.id as string,
      },
      data: { readAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "MARK_NOTIFICATIONS_READ",
        entityType: "Notification",
        entityId: notificationIds.join(","),
        metadata: JSON.stringify({ notificationIds }),
      },
    });

    return Response.json({
      success: true,
      message: "Notifications marked as read",
      data: null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, message: "Validation error", error: error.issues },
        { status: 400 }
      );
    }
    return Response.json(
      { success: false, message: "Failed to mark notifications as read", error: (error as Error).message },
      { status: 500 }
    );
  }
}
