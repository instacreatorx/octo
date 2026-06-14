import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/auth";

const ALLOWED_ROLES = ["PENDING", "USER", "ADMIN"] as const;
type Role = (typeof ALLOWED_ROLES)[number];

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const id = segments[segments.length - 1] || "";
  if (!id) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const role = body?.role as Role | undefined;

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Failed to update user role:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}


