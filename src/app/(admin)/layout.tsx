"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
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
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Tag,
  Package,
  Shield,
  Layers,
  Settings,
  LogOut,
  ChevronRight,
  ChevronsUpDown,
  User,
  Percent,
  Wallet,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  isActive?: boolean;
  children?: NavItem[];
};

type NavGroup = {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

interface AdminShellProps {
  children: React.ReactNode;
};

const NavMenuItem = ({ item }: { item: NavItem }) => {
  const Icon = item.icon;
  const pathname = usePathname();
  const isActive = pathname === item.href || item.isActive;

  if (!item.children || item.children.length === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive}>
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
          <SidebarMenuButton isActive={isActive}>
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

export default function AdminLayout({ children }: AdminShellProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  const navGroups: NavGroup[] = [
    {
      title: "Overview",
      defaultOpen: true,
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/admin",
          isActive: pathname === "/admin",
        },
      ],
    },
    {
      title: "User Management",
      defaultOpen: true,
      items: [
        {
          label: "Users",
          icon: Users,
          href: "/admin/users",
          isActive: pathname?.startsWith("/admin/users"),
        },
        {
          label: "Roles & Permissions",
          icon: Shield,
          href: "/admin/roles",
          isActive: pathname?.startsWith("/admin/roles"),
        },
      ],
    },
    {
      title: "Organization",
      defaultOpen: true,
      items: [
        {
          label: "Accounts",
          icon: Building2,
          href: "/admin/accounts",
          isActive: pathname?.startsWith("/admin/accounts"),
        },
        {
          label: "Service Categories",
          icon: Layers,
          href: "/admin/service-categories",
          isActive: pathname?.startsWith("/admin/service-categories"),
        },
      ],
    },
    {
      title: "Financial",
      defaultOpen: false,
      items: [
        {
          label: "Billing",
          icon: CreditCard,
          href: "/admin/billing",
          isActive: pathname?.startsWith("/admin/billing"),
        },
        {
          label: "Payment Configuration",
          icon: Wallet,
          href: "/admin/payment-config",
          isActive: pathname?.startsWith("/admin/payment-config"),
        },
      ],
    },
    {
      title: "Products",
      defaultOpen: false,
      items: [
        {
          label: "Packages",
          icon: Package,
          href: "/admin/packages",
          isActive: pathname?.startsWith("/admin/packages"),
        },
        {
          label: "Offers",
          icon: Tag,
          href: "/admin/offers",
          isActive: pathname?.startsWith("/admin/offers"),
        },
        {
          label: "Discounts",
          icon: Percent,
          href: "/admin/discounts",
          isActive: pathname?.startsWith("/admin/discounts"),
        },
      ],
    },
    {
      title: "System",
      defaultOpen: false,
      items: [
        {
          label: "Settings",
          icon: Settings,
          href: "/admin/settings",
          isActive: pathname?.startsWith("/admin/settings"),
        },
      ],
    },
  ];



  const initials = user?.name?.split(' ').map(n => n[0]).join('') || user?.email?.[0]?.toUpperCase() || '?';

  if (!mounted || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <SidebarProvider className="bg-white">
      <Sidebar className="bg-white border-r border-slate-200">
        <SidebarHeader className="bg-white">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="bg-white" asChild>
                <Link href="/admin">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                    <img
                      src="/logovar6.svg"
                      alt="Logo"
                      className="size-16"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold text-slate-900">Kaizen Admin</span>
                    <span className="text-xs text-slate-500">Admin Portal</span>
                  </div>
                </Link>
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
                  >
                    <ProfilePicture
                      src={user?.imageUrl}
                      firstName={user?.name?.split(' ')[0]}
                      lastName={user?.name?.split(' ')[1]}
                      email={user?.email}
                      size="sm"
                      className="rounded-lg"
                    />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium text-slate-900">{user?.name || "Admin"}</span>
                      <span className="truncate text-xs text-slate-500">
                        {user?.email || "admin@example.com"}
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
                        firstName={user?.name?.split(' ')[0]}
                        lastName={user?.name?.split(' ')[1]}
                        email={user?.email}
                        size="sm"
                        className="rounded-lg"
                      />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium text-slate-900">{user?.name || "Admin"}</span>
                        <span className="truncate text-xs text-slate-500">
                          {user?.email || "admin@example.com"}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="text-slate-700">
                    <Link href="/admin/settings">
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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4">
          <SidebarTrigger className="-ml-1 text-slate-600" />
          <Link href="/admin" className="flex items-center gap-2 md:hidden">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
              <img src="/logovar6.svg" alt="Logo" className="size-8" />
            </div>
            <span className="font-semibold text-slate-900">Admin</span>
          </Link>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}