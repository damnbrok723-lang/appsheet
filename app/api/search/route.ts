import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().min(2),
  type: z.enum(["task", "user", "document", "announcement", "event"]).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || undefined;

    const { q: query, type: searchType } = searchSchema.parse({ q, type });

    const where = {
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        { name: { contains: query, mode: "insensitive" as const } },
        { content: { contains: query, mode: "insensitive" as const } },
        { email: { contains: query, mode: "insensitive" as const } },
      ],
    };

    const tasks = searchType && searchType !== "task"
      ? []
      : await prisma.task.findMany({
          where,
          take: 10,
          include: { createdBy: true, assignedTo: true },
        });

    const users = searchType && searchType !== "user"
      ? []
      : await prisma.user.findMany({
          where: { email: { contains: query } },
          take: 10,
          include: { roleRef: true, department: true },
        });

    const documents = searchType && searchType !== "document"
      ? []
      : await prisma.document.findMany({
          where,
          take: 10,
          include: { uploadedBy: true },
        });

    const announcements = searchType && searchType !== "announcement"
      ? []
      : await prisma.announcement.findMany({
          where,
          take: 10,
          include: { createdBy: true },
        });

    const events = searchType && searchType !== "event"
      ? []
      : await prisma.event.findMany({
          where,
          take: 10,
          include: { createdBy: true },
        });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "GLOBAL_SEARCH",
        entityType: "Search",
        metadata: JSON.stringify({ query, type: searchType }),
      },
    });

    return Response.json({
      success: true,
      message: "Search results retrieved successfully",
      data: { tasks, users, documents, announcements, events },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, message: "Validation error", error: error.issues },
        { status: 400 }
      );
    }
    return Response.json(
      { success: false, message: "Failed to perform search", error: (error as Error).message },
      { status: 500 }
    );
  }
}
