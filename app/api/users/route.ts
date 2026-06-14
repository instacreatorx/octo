import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/auth";

// Admin-only list users
export const GET = requireRole(["ADMIN"])(async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Failed to list users:", error);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
});

