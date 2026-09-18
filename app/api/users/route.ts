import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).default("EMPLOYEE"),
  departmentId: z.string().optional(),
  teamId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id as string }, select: { id: true, role: true, departmentId: true, teamId: true } });
    if (!currentUser) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const where: Prisma.UserWhereInput = currentUser.role === "ADMIN"
      ? {}
      : currentUser.role === "MANAGER"
        ? { OR: [{ departmentId: currentUser.departmentId ?? undefined }, { teamId: currentUser.teamId ?? undefined }] }
        : { id: currentUser.id };

    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, name: true, email: true, role: true, status: true, avatarUrl: true, jobTitle: true, permissions: true,
          roleRef: { select: { name: true } },
          department: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Users retrieved successfully",
      data: { users, total, page, limit },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve users", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { roleRef: true },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createUserSchema.parse(body);

    const passwordHash = await hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        passwordHash,
        role: validated.role,
        departmentId: validated.departmentId,
        teamId: validated.teamId,
      },
      include: { roleRef: true, department: true, team: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "CREATE",
        entityType: "User",
        entityId: user.id,
        metadata: JSON.stringify({ name: user.name, email: user.email, role: user.role }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to create user", error: (error as Error).message },
      { status: 500 }
    );
  }
}
