import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json({ success: false, message: "Document not found" }, { status: 404 });
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DOWNLOAD_DOCUMENT",
        entityType: "Document",
        entityId: document.id,
        metadata: JSON.stringify({ filePath: document.filePath, fileName: document.name }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document download initiated",
      data: {
        filePath: document.filePath,
        fileName: document.name,
        mimeType: document.mimeType,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to download document", error }, { status: 500 });
  }
}
