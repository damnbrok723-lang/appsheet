import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const updateDocumentSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

async function getDocumentOr404(id: string) {
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ success: false, message: "Document not found" }, { status: 404 });
  }
  return document;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const document = await getDocumentOr404(id);
    if ("success" in document && !document.success) return document as NextResponse;

    const enrichedDocument = await prisma.document.findUnique({
      where: { id: (document as unknown as { id: string }).id },
      include: { uploadedBy: true, team: true },
    });

    return NextResponse.json({
      success: true,
      message: "Document retrieved successfully",
      data: enrichedDocument,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to retrieve document", error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const document = await getDocumentOr404(id);
    if ("success" in document && !document.success) return document as NextResponse;

    const body = await req.json();
    const validated = updateDocumentSchema.parse(body);

    const updatedDocument = await prisma.document.update({
      where: { id: (document as unknown as { id: string }).id },
      data: validated,
      include: { uploadedBy: true, team: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "UPDATE_DOCUMENT",
        entityType: "Document",
        entityId: updatedDocument.id,
        metadata: JSON.stringify({ name: updatedDocument.name }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document updated successfully",
      data: updatedDocument,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Failed to update document", error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const document = await getDocumentOr404(id);
    if ("success" in document && !document.success) return document as NextResponse;

    await prisma.document.delete({ where: { id: (document as unknown as { id: string }).id } });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "DELETE_DOCUMENT",
        entityType: "Document",
        entityId: (document as unknown as { id: string }).id,
        metadata: JSON.stringify({ name: (document as unknown as { name: string }).name }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
      data: null,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to delete document", error }, { status: 500 });
  }
}
