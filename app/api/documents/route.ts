import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { uploadStorageFile } from "@/lib/storage";

const createDocumentSchema = z.object({ name: z.string().min(1), description: z.string().optional(), teamId: z.string().optional() });
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

function isAllowedFile(file: File) {
  if (ALLOWED_MIME_TYPES.has(file.type)) return true;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return ["png", "jpg", "jpeg", "webp", "pdf", "doc", "docx", "xls", "xlsx", "txt"].includes(extension ?? "");
}

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

    const isJson = req.headers.get("content-type")?.includes("application/json");
    const body = isJson ? await req.json() as { path?: string; name?: string; description?: string; teamId?: string; mimeType?: string; fileSize?: number } : null;
    let file: File | null = null;
    let filePath: string;
    let mimeType: string;
    let fileSize: number;
    let validated: z.infer<typeof createDocumentSchema>;
    if (body?.path) {
      if (!body.path.startsWith(`${session.user.id}/documents/`)) return NextResponse.json({ success: false, message: "Document path tidak valid" }, { status: 400 });
      filePath = body.path;
      mimeType = body.mimeType || "application/octet-stream";
      fileSize = Number(body.fileSize || 0);
      validated = createDocumentSchema.parse({ name: body.name || body.path.split("/").pop() || "document", description: body.description, teamId: body.teamId });
    } else {
      const formData = await req.formData();
      const uploadedFile = formData.get("file");
      if (!(uploadedFile instanceof File) || uploadedFile.size === 0) return NextResponse.json({ success: false, message: "File is required" }, { status: 400 });
      if (uploadedFile.size > MAX_UPLOAD_SIZE_BYTES) return NextResponse.json({ success: false, message: "Ukuran file terlalu besar. Maksimal 5 MB per file." }, { status: 413 });
      if (!isAllowedFile(uploadedFile)) return NextResponse.json({ success: false, message: "Jenis file tidak didukung. Gunakan JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, atau TXT." }, { status: 400 });
      file = uploadedFile;
      validated = createDocumentSchema.parse({ name: String(formData.get("name") || file.name), description: String(formData.get("description") || "") || undefined, teamId: String(formData.get("teamId") || "") || undefined });
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      filePath = `${session.user.id}/${Date.now()}-${safeName}`;
      await uploadStorageFile(filePath, file);
      mimeType = file.type || "application/octet-stream";
      fileSize = file.size;
    }

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
