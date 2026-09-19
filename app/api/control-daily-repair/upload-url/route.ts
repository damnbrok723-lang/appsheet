import { NextResponse } from "next/server";
import { getSession } from "@/lib/permissions";
import { createStorageUploadUrl } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await request.json() as { name?: string; folder?: string; taskId?: string };
    const safeName = String(body.name || "import.xlsx").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const folder = body.folder === "documents"
      ? "documents"
      : body.folder === "tasks" && body.taskId && /^[a-zA-Z0-9_-]+$/.test(body.taskId)
        ? `tasks/${body.taskId}`
        : "imports";
    const path = `${session.user.id}/${folder}/${Date.now()}-${safeName}`;
    const upload = await createStorageUploadUrl(path);
    return NextResponse.json({ success: true, data: upload });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Gagal membuat upload URL" }, { status: 500 });
  }
}