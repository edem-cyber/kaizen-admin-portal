"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import { useAuthorization } from "@/lib/authorization";
import type { TabKey } from "@/lib/authorization";
import { cn } from "@/lib/utils";
import { ProfilePicture } from "@/components/ui/profile-picture";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  Store,
  Users,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  ChevronsUpDown,
  User,
  Wallet,
  BarChart3,
  SlidersHorizontal,
  FileBarChart,
  CircleDollarSign,
} from "lucide-react";
import { CurrencySelector } from "@/components/currency";
import Image from "next/image";
import { SetupWarningsBanner } from "@/components/onboarding/setup-warnings-banner";

type NavItem = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  tabKey: TabKey;
  isActive?: boolean;
  children?: NavItem[];
};

type NavGroup = {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

interface ApplicationShellProps {
  children: React.ReactNode;
  className?: string;
}

const NavMenuItem = ({ item }: { item: NavItem; }) => {
  const Icon = item.icon;
  const pathname = usePathname();
  const isActive = pathname === item.href || item.isActive;

  if (!item.children || item.children.length === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
          <Link href={item.href}>
            <Icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isActive} tooltip={item.label}>
            <Icon className="size-4" />
            <span>{item.label}</span>
            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child) => (
              <SidebarMenuSubItem key={child.label}>
                <SidebarMenuSubButton asChild isActive={pathname === child.href}>
                  <Link href={child.href}>{child.label}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};

export function ApplicationShell({ children, className }: ApplicationShellProps) {
  const { user, logout } = useAuth();
  const { canAccessTab } = useAuthorization();
  const pathname = usePathname();

  // Subscribe to the notifications SSE stream app-wide so any mounted
  // notification UI (page, header bell) stays fresh in real time.
  useNotificationStream();

  const allNavGroups: NavGroup[] = [
    {
      title: "Overview",
      defaultOpen: true,
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/admin",
          tabKey: "dashboard",
          isActive: pathname === "/admin",
        },
        {
          label: "Analytics",
          icon: BarChart3,
          href: "/analytics",
          tabKey: "analytics",
          isActive: pathname?.startsWith("/analytics"),
        },
      ],
    },
    {
      title: "KaizenAdmins",
      defaultOpen: true,
      items: [
        {
          label: "My KaizenAdmins",
          icon: FileText,
          href: "/kaizenAdmins",
          tabKey: "kaizenAdmins",
          isActive: pathname?.startsWith("/kaizenAdmins"),
        },
        {
          label: "Approvals",
          icon: CheckCircle,
          href: "/approvals",
          tabKey: "approvals",
          isActive: pathname?.startsWith("/approvals"),
        },
      ],
    },
    {
      title: "Financials",
      defaultOpen: false,
      items: [
        {
          label: "Budget",
          icon: Wallet,
          href: "/budget",
          tabKey: "budget",
          isActive: pathname === "/budget",
        },
        {
          label: "Payments",
          icon: CircleDollarSign,
          href: "/payments",
          tabKey: "payments",
          isActive: pathname?.startsWith("/payments"),
        },
        {
          label: "Vendors",
          icon: Store,
          href: "/vendors",
          tabKey: "vendors",
          isActive: pathname?.startsWith("/vendors"),
        },
      ],
    },
    {
      title: "Reports",
      defaultOpen: false,
      items: [
        {
          label: "Reports",
          icon: FileBarChart,
          href: "/reports",
          tabKey: "reports",
          isActive: pathname?.startsWith("/reports"),
          children: [
            {
              label: "Budget Performance",
              icon: Wallet,
              href: "/reports/budget-performance",
              tabKey: "reports",
              isActive: pathname?.startsWith("/reports/budget-performance"),
            },
            {
              label: "Comparative Analysis",
              icon: BarChart3,
              href: "/reports/comparative-analysis",
              tabKey: "reports",
              isActive: pathname?.startsWith("/reports/comparative-analysis"),
            },
            {
              label: "Predictive Analysis",
              icon: BarChart3,
              href: "/reports/predictive-analysis",
              tabKey: "reports",
              isActive: pathname?.startsWith("/reports/predictive-analysis"),
            },
          ],
        },
      ],
    },
    {
      title: "Organization",
      defaultOpen: false,
      items: [
        {
          label: "Team Members",
          icon: Users,
          href: "/users",
          tabKey: "users",
          isActive: pathname === "/users",
        },
        {
          label: "Configuration",
          icon: SlidersHorizontal,
          href: "/configuration",
          tabKey: "configuration",
          isActive: pathname?.startsWith("/configuration"),
        },
        {
          label: "Settings",
          icon: Settings,
          href: "/settings",
          tabKey: "settings",
          isActive: pathname === "/settings",
        },
      ],
    },
  ];

  // Filter to only tabs this role can access. Drop groups that end up empty.
  const navGroups = allNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessTab(item.tabKey)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <TooltipProvider>
      <SidebarProvider className={cn("bg-white", className)}>
        <Sidebar collapsible="icon" className="bg-white border-r border-slate-200">
          <SidebarHeader className="bg-white">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="bg-white h-14" tooltip="KaizenAdmins">
                  <div className="flex items-center justify-center rounded-lg">
                    <Image
                      src="/logovar6.svg"
                      alt="Logo"
                      width={50}
                      height={50}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold text-slate-900">KaizenAdmins</span>
                    <span className="text-xs text-slate-500">Management System</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent className="bg-white overflow-hidden">
            <ScrollArea className="min-h-0 flex-1">
              {navGroups.map((group) => (
                <SidebarGroup key={group.title}>
                  <SidebarGroupLabel className="text-slate-500">{group.title}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <NavMenuItem key={item.label} item={item} />
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter className="bg-white border-t border-slate-200">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-slate-100 data-[state=open]:text-slate-900"
                      tooltip={user?.name || "User"}
                    >
                      <ProfilePicture
                        src={user?.imageUrl}
                        firstName={user?.name?.split(" ")[0]}
                        lastName={user?.name?.split(" ")[1]}
                        email={user?.email}
                        size="sm"
                        className="rounded-lg"
                      />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium text-slate-900">{user?.name || "User"}</span>
                        <span className="truncate text-xs text-slate-500">
                          {user?.email || "user@example.com"}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4 text-slate-400" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-white"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <ProfilePicture
                          src={user?.imageUrl}
                          firstName={user?.name?.split(" ")[0]}
                          lastName={user?.name?.split(" ")[1]}
                          email={user?.email}
                          size="sm"
                          className="rounded-lg"
                        />
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-medium text-slate-900">{user?.name || "User"}</span>
                          <span className="truncate text-xs text-slate-500">
                            {user?.email || "user@example.com"}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="text-slate-700">
                      <Link href="/settings">
                        <User className="mr-2 size-4" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600">
                      <LogOut className="mr-2 size-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

        </Sidebar>
        <SidebarInset className="bg-slate-50">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4 md:px-6">
            <SidebarTrigger className="-ml-1 text-slate-600" />
            <Link href="/admin" className="flex items-center gap-2 md:hidden">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-600">
                <img src="/logovar6.svg" alt="Logo" className="size-5 invert" />
              </div>
              <span className="font-semibold text-slate-900">KaizenAdmin</span>
            </Link>
            <div className="flex-1" />
            {/* Currency Selector - Amazon-style with flag */}
            <CurrencySelector variant="ghost" size="sm" allowedCurrency="GHS" />
            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-1 top-1 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-white">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Notifications</span>
                    <Link href="/notifications" className="text-xs text-indigo-600 hover:text-indigo-700">
                      View all
                    </Link>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="font-medium text-slate-900 text-sm">KaizenAdmin approved</span>
                    </div>
                    <p className="text-xs text-slate-500 pl-4">Your kaizenAdmin #REQ-001 has been approved</p>
                    <span className="text-xs text-slate-400 pl-4">2 hours ago</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                      <span className="font-medium text-slate-900 text-sm">Pending approval</span>
                    </div>
                    <p className="text-xs text-slate-500 pl-4">You have 3 items awaiting your approval</p>
                    <span className="text-xs text-slate-400 pl-4">5 hours ago</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="font-medium text-slate-900 text-sm">New comment</span>
                    </div>
                    <p className="text-xs text-slate-500 pl-4">John commented on kaizenAdmin #REQ-003</p>
                    <span className="text-xs text-slate-400 pl-4">Yesterday</span>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Link href="/notifications" className="block w-full text-center text-sm text-indigo-600 hover:text-indigo-700 py-1">
                    View all notifications
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            <SetupWarningsBanner />
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
