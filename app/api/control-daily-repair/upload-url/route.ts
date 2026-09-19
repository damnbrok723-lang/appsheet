import { NextResponse } from "next/server";
import { getSession } from "@/lib/permissions";
import { createStorageUploadUrl } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await request.json() as { name?: string };
    const safeName = String(body.name || "import.xlsx").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const path = `${session.user.id}/imports/${Date.now()}-${safeName}`;
    const upload = await createStorageUploadUrl(path);
    return NextResponse.json({ success: true, data: upload });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Gagal membuat upload URL" }, { status: 500 });
  }
}