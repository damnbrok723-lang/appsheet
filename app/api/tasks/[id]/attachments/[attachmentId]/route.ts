import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { downloadStorageFile } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const { id, attachmentId } = await params;
  const attachment = await prisma.taskAttachment.findFirst({ where: { id: attachmentId, taskId: id } });
  if (!attachment) return NextResponse.json({ success: false, message: "Attachment not found" }, { status: 404 });
  const file = await downloadStorageFile(attachment.filePath);
  return new NextResponse(file.body, { headers: { "Content-Type": attachment.mimeType, "Content-Length": String(attachment.fileSize), "Content-Disposition": `attachment; filename="${attachment.fileName.replace(/"/g, "")}"` } });
}