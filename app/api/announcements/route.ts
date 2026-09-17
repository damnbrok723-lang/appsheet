import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  teamId: z.string().optional(),
  publishedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        include: { createdBy: true, team: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.announcement.count(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Announcements retrieved successfully",
      data: { announcements, total, page, limit },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to retrieve announcements", error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createAnnouncementSchema.parse(body);

    const announcement = await prisma.announcement.create({
      data: {
        title: validated.title,
        content: validated.content,
        teamId: validated.teamId,
        publishedAt: validated.publishedAt,
        expiresAt: validated.expiresAt,
        createdById: session.user.id,
      },
      include: { createdBy: true, team: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_ANNOUNCEMENT",
        entityType: "Announcement",
        entityId: announcement.id,
        metadata: JSON.stringify({ title: announcement.title, teamId: announcement.teamId }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Announcement created successfully",
      data: announcement,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Failed to create announcement", error }, { status: 500 });
  }
}
