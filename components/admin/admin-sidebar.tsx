"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      localStorage.removeItem("auth_token");
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      router.push("/login");
    }
  };

  return (
    <aside className="w-60 border-r bg-card/50 backdrop-blur">
      <div className="p-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <div>
          <div className="text-sm font-semibold">پنل ادمین</div>
          <div className="text-xs text-muted-foreground">مدیریت کاربران</div>
        </div>
      </div>
      <nav className="px-2 space-y-1">
        <Link href="/admin/users">
          <div
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition",
              pathname === "/admin/users" ? "bg-muted font-semibold" : "text-muted-foreground"
            )}
          >
            <Users className="h-4 w-4" />
            کاربران
          </div>
        </Link>
      </nav>
      <div className="px-2 mt-auto py-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          خروج
        </Button>
      </div>
    </aside>
  );
}

