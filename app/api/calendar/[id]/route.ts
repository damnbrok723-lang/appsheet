import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const updateEventSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  location: z.string().optional(),
});

async function getEventOr404(id: string) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
  }
  return event;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await getEventOr404(id);
    if ("success" in event && !event.success) return event as NextResponse;

    const enrichedEvent = await prisma.event.findUnique({
      where: { id: (event as unknown as { id: string }).id },
      include: { createdBy: true, participants: true, team: true },
    });

    return NextResponse.json({
      success: true,
      message: "Event retrieved successfully",
      data: enrichedEvent,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to retrieve event", error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await getEventOr404(id);
    if ("success" in event && !event.success) return event as NextResponse;

    if ((event as { createdById: string }).createdById !== session.user.id && (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validated = updateEventSchema.parse(body);

    const updatedEvent = await prisma.event.update({
      where: { id: (event as unknown as { id: string }).id },
      data: validated,
      include: { createdBy: true, participants: true, team: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "UPDATE_EVENT",
        entityType: "Event",
        entityId: updatedEvent.id,
        metadata: JSON.stringify({ title: updatedEvent.title }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Failed to update event", error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await getEventOr404(id);
    if ("success" in event && !event.success) return event as NextResponse;

    if ((event as { createdById: string }).createdById !== session.user.id && (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await prisma.event.delete({ where: { id: (event as unknown as { id: string }).id } });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "DELETE_EVENT",
        entityType: "Event",
        entityId: (event as unknown as { id: string }).id,
        metadata: JSON.stringify({ title: (event as unknown as { title: string }).title }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
      data: null,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to delete event", error }, { status: 500 });
  }
}
