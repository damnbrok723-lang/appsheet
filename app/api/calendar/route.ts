import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  location: z.string().optional(),
  teamId: z.string().optional(),
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const teamId = searchParams.get("teamId");

    const skip = (page - 1) * limit;

    const where: { teamId?: string; startAt?: { gte?: Date; lte?: Date } } = {};
    if (teamId) where.teamId = teamId;
    if (startDate || endDate) {
      where.startAt = {};
      if (startDate) where.startAt.gte = new Date(startDate);
      if (endDate) where.startAt.lte = new Date(endDate);
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          participants: { select: { id: true, userId: true, status: true } },
          team: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { startAt: "asc" },
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Events retrieved successfully",
      data: { events, total, page, limit },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to retrieve events", error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createEventSchema.parse(body);

    const event = await prisma.event.create({
      data: {
        title: validated.title,
        description: validated.description,
        startAt: validated.startAt,
        endAt: validated.endAt,
        location: validated.location,
        teamId: validated.teamId,
        createdById: session.user.id,
      },
      include: { createdBy: true, participants: true, team: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_EVENT",
        entityType: "Event",
        entityId: event.id,
        metadata: JSON.stringify({ title: event.title, teamId: event.teamId }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Failed to create event", error }, { status: 500 });
  }
}
