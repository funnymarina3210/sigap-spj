import { useState } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  LayoutGrid, 
  TableIcon, 
  Plus,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserRole, canCreateSubmission } from "@/types/submission";

interface AppSidebarProps {
  userRole: UserRole;
  onCreateSubmission?: () => void;
}

export function AppSidebar({ userRole, onCreateSubmission }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const canCreate = canCreateSubmission(userRole);

  // Menu items based on role
  const mainMenuItems = [
    { 
      title: "Dashboard", 
      url: "/dashboard", 
      icon: LayoutDashboard,
      roles: ['admin', 'ppk', 'bendahara', 'user'] as UserRole[]
    },
  ];

  const submissionMenuItems = [
    { 
      title: "Tampilan Card", 
      url: "/submissions/card", 
      icon: LayoutGrid,
      roles: ['admin', 'ppk', 'bendahara', 'user'] as UserRole[]
    },
    { 
      title: "Tampilan Tabel", 
      url: "/submissions/table", 
      icon: TableIcon,
      roles: ['admin', 'ppk', 'bendahara', 'user'] as UserRole[]
    },
  ];

  const actionMenuItems: { 
    title: string; 
    url: string; 
    icon: typeof Plus; 
    roles: UserRole[]; 
    action?: () => void 
  }[] = [
    { 
      title: "Buat Pengajuan", 
      url: "#create", 
      icon: Plus,
      roles: ['admin', 'user'] as UserRole[],
      action: onCreateSubmission
    },
  ];

  const isActive = (path: string) => {
    if (path === "#create") return false;
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  const filterByRole = <T extends { roles: UserRole[] }>(items: T[]): T[] => {
    return items.filter(item => item.roles.includes(userRole));
  };

  return (
    <Sidebar
      className={cn(
        "border-r bg-card transition-all duration-300",
        collapsed ? "w-14" : "w-60"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b p-3">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <span className="text-sm font-semibold text-foreground">Menu</span>
          )}
          <SidebarTrigger className="h-7 w-7" />
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {/* Main Menu */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 py-2">
              Utama
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {filterByRole(mainMenuItems).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <RouterNavLink
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                        isActive(item.url)
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </RouterNavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Submissions Menu */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 py-2">
              Daftar Pengajuan
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {filterByRole(submissionMenuItems).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <RouterNavLink
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                        isActive(item.url)
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </RouterNavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Actions Menu */}
        {canCreate && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 py-2">
                Aksi
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {filterByRole(actionMenuItems).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <button
                        onClick={item.action}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left",
                          "hover:bg-primary/10 text-primary font-medium"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
