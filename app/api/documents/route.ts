import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const createDocumentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
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

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        include: { uploadedBy: true, team: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.document.count(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Documents retrieved successfully",
      data: { documents, total, page, limit },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to retrieve documents", error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createDocumentSchema.parse(body);

    const filePath = `/uploads/documents/${Date.now()}-${validated.name}`;
    const mimeType = validated.name.split(".").pop() ? `application/${validated.name.split(".").pop()}` : "application/octet-stream";
    const fileSize = 0;

    const document = await prisma.document.create({
      data: {
        name: validated.name,
        description: validated.description,
        filePath,
        mimeType,
        fileSize,
        teamId: validated.teamId,
        uploadedById: session.user.id,
      },
      include: { uploadedBy: true, team: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_DOCUMENT",
        entityType: "Document",
        entityId: document.id,
        metadata: JSON.stringify({ name: document.name, filePath: document.filePath }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Failed to upload document", error }, { status: 500 });
  }
}
