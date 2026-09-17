import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const updateAnnouncementSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  publishedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

async function getAnnouncementOr404(id: string) {
  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) {
    return NextResponse.json({ success: false, message: "Announcement not found" }, { status: 404 });
  }
  return announcement;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const announcement = await getAnnouncementOr404(id);
    if ("success" in announcement && !announcement.success) return announcement as NextResponse;

    const enrichedAnnouncement = await prisma.announcement.findUnique({
      where: { id: (announcement as unknown as { id: string }).id },
      include: { createdBy: true, team: true },
    });

    return NextResponse.json({
      success: true,
      message: "Announcement retrieved successfully",
      data: enrichedAnnouncement,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to retrieve announcement", error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const announcement = await getAnnouncementOr404(id);
    if ("success" in announcement && !announcement.success) return announcement as NextResponse;

    const body = await req.json();
    const validated = updateAnnouncementSchema.parse(body);

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: (announcement as unknown as { id: string }).id },
      data: validated,
      include: { createdBy: true, team: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "UPDATE_ANNOUNCEMENT",
        entityType: "Announcement",
        entityId: updatedAnnouncement.id,
        metadata: JSON.stringify({ title: updatedAnnouncement.title }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Announcement updated successfully",
      data: updatedAnnouncement,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Failed to update announcement", error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const announcement = await getAnnouncementOr404(id);
    if ("success" in announcement && !announcement.success) return announcement as NextResponse;

    await prisma.announcement.delete({ where: { id: (announcement as unknown as { id: string }).id } });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "DELETE_ANNOUNCEMENT",
        entityType: "Announcement",
        entityId: (announcement as unknown as { id: string }).id,
        metadata: JSON.stringify({ title: (announcement as unknown as { title: string }).title }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Announcement deleted successfully",
      data: null,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to delete announcement", error }, { status: 500 });
  }
}
