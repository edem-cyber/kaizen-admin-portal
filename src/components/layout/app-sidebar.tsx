"use client";

import * as React from "react";
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  Store,
  Users,
  Settings,
  BarChart3,
  MessageSquare,
  Crown,
  LogOut,
  User,
} from "lucide-react";

import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "KaizenAdmins",
    url: "/kaizenAdmins",
    icon: FileText,
  },
  {
    title: "Approvals",
    url: "/approvals",
    icon: CheckCircle,
  },
  {
    title: "Vendors",
    url: "/vendors",
    icon: Store,
  },
  {
    title: "Discussions",
    url: "/discussions",
    icon: MessageSquare,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useSidebar();
  const fromApprovals = searchParams.get("from") === "approvals";

  const isMenuActive = (itemUrl: string) => {
    // If viewing a kaizenAdmin from approvals, keep approvals active
    if (fromApprovals && pathname?.startsWith("/kaizenAdmins/")) {
      return itemUrl === "/approvals";
    }
    // Default behavior
    return pathname === itemUrl || pathname?.startsWith(itemUrl + "/");
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href="/admin"
          className="flex items-center gap-2 px-2 py-4 justify-center data-[state=expanded]:justify-start"
          data-state={state}
        >
          <Image
            src="/logovar6.svg"
            alt="KaizenAdmin"
            width={32}
            height={32}
            className="h-8 w-8 flex-shrink-0"
          />
          <span className="text-sm font-semibold tracking-tight text-slate-900 group-data-[collapsible=icon]:hidden">KaizenAdmin</span>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isMenuActive(item.url)}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-4">
        <Button
          asChild
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/25 mb-3"
        >
          <Link href="/subscription" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            <span>My Subscription</span>
          </Link>
        </Button>

        {/* User Menu with App Switcher - Google Style */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm text-slate-600">Account</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">User Name</p>
                <p className="text-xs text-muted-foreground">user@email.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 text-red-600">
              <LogOut className="w-4 h-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}