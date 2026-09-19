import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { uploadStorageFile } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ success: false, message: "File is required" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ success: false, message: "Ukuran file terlalu besar. Maksimal 5 MB per file." }, { status: 413 });
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain"]);
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!allowedTypes.has(file.type) && !["png", "jpg", "jpeg", "webp", "pdf", "doc", "docx", "xls", "xlsx", "txt"].includes(extension ?? "")) {
    return NextResponse.json({ success: false, message: "Jenis file tidak didukung. Gunakan JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, atau TXT." }, { status: 400 });
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `tasks/${id}/${Date.now()}-${safeName}`;
  await uploadStorageFile(filePath, file);
  const attachment = await prisma.taskAttachment.create({ data: { taskId: id, uploadedById: session.user.id, fileName: file.name, filePath, mimeType: file.type || "application/octet-stream", fileSize: file.size } });
  await prisma.activityLog.create({ data: { userId: session.user.id, action: "TASK_ATTACHMENT_UPLOADED", entityType: "Task", entityId: id, metadata: JSON.stringify({ fileName: file.name }) } });
  return NextResponse.json({ success: true, data: attachment }, { status: 201 });
}