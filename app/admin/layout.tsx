import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/token";
import { prisma } from "@/lib/db";
import AdminSidebar from "@/components/admin/admin-sidebar";

export const metadata = {
  title: "پنل ادمین",
};

type LayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: LayoutProps) {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get("auth_token")?.value || null;
  const payload = rawToken ? verifyToken(rawToken) : null;

  if (!payload) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, email: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

