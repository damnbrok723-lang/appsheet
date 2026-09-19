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
  const isJson = request.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await request.json() as { path?: string; fileName?: string; mimeType?: string; fileSize?: number } : null;
  let file: File | null = null;
  let fileName: string;
  let filePath: string;
  let mimeType: string;
  let fileSize: number;
  if (body?.path) {
    if (!body.path.startsWith(`${session.user.id}/tasks/${id}/`)) return NextResponse.json({ success: false, message: "Attachment path tidak valid" }, { status: 400 });
    filePath = body.path;
    fileName = body.fileName || body.path.split("/").pop() || "attachment";
    mimeType = body.mimeType || "application/octet-stream";
    fileSize = Number(body.fileSize || 0);
  } else {
    const formData = await request.formData();
    const uploadedFile = formData.get("file");
    if (!(uploadedFile instanceof File) || uploadedFile.size === 0) return NextResponse.json({ success: false, message: "File is required" }, { status: 400 });
    if (uploadedFile.size > 5 * 1024 * 1024) return NextResponse.json({ success: false, message: "Ukuran file terlalu besar. Maksimal 5 MB per file." }, { status: 413 });
    file = uploadedFile;
    fileName = file.name;
    filePath = `tasks/${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    mimeType = file.type || "application/octet-stream";
    fileSize = file.size;
  }
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain"]);
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!allowedTypes.has(mimeType) && !["png", "jpg", "jpeg", "webp", "pdf", "doc", "docx", "xls", "xlsx", "txt"].includes(extension ?? "")) {
    return NextResponse.json({ success: false, message: "Jenis file tidak didukung. Gunakan JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, atau TXT." }, { status: 400 });
  }
  if (file) await uploadStorageFile(filePath, file);
  const attachment = await prisma.taskAttachment.create({ data: { taskId: id, uploadedById: session.user.id, fileName, filePath, mimeType, fileSize } });
  await prisma.activityLog.create({ data: { userId: session.user.id, action: "TASK_ATTACHMENT_UPLOADED", entityType: "Task", entityId: id, metadata: JSON.stringify({ fileName }) } });
  return NextResponse.json({ success: true, data: attachment }, { status: 201 });
}