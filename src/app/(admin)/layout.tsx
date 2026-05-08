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
  Shield,
  Layers,
  Settings,
  LogOut,
  ChevronRight,
  ChevronsUpDown,
  User,
  Percent,
  Wallet,
  FileText,
  Home,
  LayoutGrid,
  UserPlus,
  ClipboardList,
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
        <SidebarMenuButton asChild isActive={isActive} className={cn(
          "h-11 px-4 rounded-xl transition-all duration-200",
          isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold" : "text-slate-600 hover:bg-slate-100/50"
        )}>
          <Link href={item.href} className="flex items-center gap-3">
            <Icon className={cn("size-5", isActive ? "text-sidebar-accent-foreground" : "text-slate-400")} strokeWidth={1.5} />
            <span className="text-[15px]">{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isActive} className={cn(
            "h-11 px-4 rounded-xl transition-all duration-200",
            isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold" : "text-slate-600 hover:bg-slate-100/50"
          )}>
            <div className="flex items-center gap-3 w-full">
              <Icon className={cn("size-5", isActive ? "text-sidebar-accent-foreground" : "text-slate-400")} strokeWidth={1.5} />
              <span className="text-[15px]">{item.label}</span>
              <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="ml-4 border-l border-slate-100 pl-4 mt-1 space-y-1">
            {item.children.map((child) => (
              <SidebarMenuSubItem key={child.label}>
                <SidebarMenuSubButton asChild isActive={pathname === child.href} className={cn(
                  "h-10 px-4 rounded-lg transition-all duration-200",
                  pathname === child.href ? "text-sidebar-accent-foreground font-bold" : "text-slate-500 hover:text-slate-900"
                )}>
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
      title: "Navigation",
      defaultOpen: true,
      items: [
        {
          label: "Home",
          icon: Home,
          href: "/admin",
          isActive: pathname === "/admin",
        },
        {
          label: "Subject Areas",
          icon: LayoutGrid,
          href: "/admin/service-categories",
          isActive: pathname?.startsWith("/admin/service-categories"),
        },
        {
          label: "Products / Services",
          icon: Layers,
          href: "/admin/offers",
          isActive: pathname?.startsWith("/admin/offers") || pathname?.startsWith("/admin/discounts") || pathname?.startsWith("/admin/package-templates") || pathname?.startsWith("/admin/product-categories"),
          children: [
            { label: "Offers", icon: Tag, href: "/admin/offers" },
            { label: "Discounts", icon: Percent, href: "/admin/discounts" },
            { label: "Package Templates", icon: Layers, href: "/admin/package-templates" },
            { label: "Product Categories", icon: FileText, href: "/admin/product-categories" },
          ]
        },
        {
          label: "Subscription & Billing",
          icon: FileText,
          href: "/admin/billing",
          isActive: pathname?.startsWith("/admin/billing") || pathname?.startsWith("/admin/payment-config"),
        },
        {
          label: "Content Providers",
          icon: UserPlus,
          href: "/admin/users",
          isActive: pathname?.startsWith("/admin/users") || pathname?.startsWith("/admin/roles"),
        },
        {
          label: "Reports",
          icon: ClipboardList,
          href: "/admin/reports",
          isActive: pathname?.startsWith("/admin/reports"),
        },
      ],
    },
    {
      title: "Account",
      defaultOpen: true,
      items: [
        {
          label: "Team",
          icon: Users,
          href: "/admin/accounts",
          isActive: pathname?.startsWith("/admin/accounts"),
        },
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
              <SidebarMenuButton size="lg" className="hover:bg-transparent" asChild>
                <Link href="/admin" className="flex items-center gap-3">
                  <div className="flex aspect-square size-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 p-0.5 shadow-lg shadow-violet-500/20">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                      <div className="h-4 w-4 rounded-full border-2 border-violet-500" />
                    </div>
                  </div>
                  <span className="text-xl font-bold tracking-tight text-slate-900">Kaizen Ace It!</span>
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
      <SidebarInset className="bg-[#F8FAFC]">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 md:px-6">
          <SidebarTrigger className="-ml-1 text-slate-400 hover:text-violet-600 transition-colors" />
          <div className="h-4 w-px bg-slate-200 mx-2 hidden md:block" />
          <Link href="/admin" className="flex items-center gap-2 md:hidden">
            <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                <div className="h-2 w-2 rounded-full border border-violet-500" />
              </div>
            </div>
            <span className="font-bold text-slate-900">Kaizen</span>
          </Link>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}