"use client"

import * as React from "react"
import { Github, LogOut, Settings, Shield, User, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ThreadList } from "./assistant-ui/thread-list"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MeResponse = {
  id: string
  email: string
  role: string
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const [me, setMe] = React.useState<MeResponse | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" })
        if (res.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem("auth_token");
          router.push('/login');
          return;
        }
        if (res.ok) {
          const data = await res.json()
          setMe(data)
        }
      } catch (e) {
        console.error("Failed to load user", e)
      } finally {
        setLoading(false)
      }
    }
    fetchMe()
  }, [router])

  const handleSettings = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("app-open-settings"))
    }
  }

  const handleAdmin = () => {
    router.push("/admin/users")
  }

  const handleLogout = async () => {
    try {
      localStorage.removeItem("auth_token")
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    } catch (e) {
      console.error("Logout failed", e)
    } finally {
      router.push("/login")
    }
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Image src="/nemo.png" alt="Nemo" width={16} height={16} className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">XQL</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ThreadList />
      </SidebarContent>

      <SidebarRail />
      <SidebarFooter>
        <div className="px-2 pb-2 w-full">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-lg px-3 py-2 border border-sidebar-border"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                  {me?.email ? me.email.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-semibold leading-tight">
                    {me?.email || (loading ? "در حال بارگذاری..." : "")}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="top"
              sideOffset={6}
              className={cn("w-64 mt-1")}
            >
              <DropdownMenuLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {me?.email || ""}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                تنظیمات
              </DropdownMenuItem>
              {me?.role === "ADMIN" && (
                <DropdownMenuItem onClick={handleAdmin} className="cursor-pointer">
                  <Shield className="h-4 w-4 mr-2" />
                  پنل ادمین
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                خروج
              </DropdownMenuItem>
              {loading && (
                <DropdownMenuItem disabled className="gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال بارگذاری...
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
