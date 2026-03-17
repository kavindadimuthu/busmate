"use client";

import { useEffect, useRef, useState } from "react";
import { CircleUser, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import signOut from "@/lib/utils/signOut";
import type UserData from "@/types/UserData";

interface PortalSidebarUserProps {
  userData: UserData;
  collapsed: boolean;
  rolePath: string;
}

export function PortalSidebarUser({
  userData,
  collapsed,
  rolePath,
}: PortalSidebarUserProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = userData.firstName || userData.email || "User";
  const displayEmail = userData.email;
  const displayRole = userData.user_role || "User";

  return (
    <div className="relative" ref={menuRef}>
      {menuOpen && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-background rounded-xl shadow-xl border border-border py-1 z-50 min-w-[200px]">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground truncate">{displayEmail}</p>
            <p className="text-xs text-muted-foreground capitalize truncate">{displayRole}</p>
          </div>

          <Link
            href={`/${rolePath}/profile`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <CircleUser className="w-4 h-4 text-muted-foreground" />
            Profile
          </Link>

          <Link
            href={`/${rolePath}/settings`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            Settings
          </Link>

          <div className="border-t border-border my-1" />

          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}

      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className={`flex items-center gap-2.5 w-full rounded-md transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-muted/30 ${
          collapsed ? "justify-center p-2" : "px-3 py-2"
        }`}
        title={collapsed ? displayName : undefined}
      >
        <div className="w-8 h-8 rounded-full bg-sidebar-active flex items-center justify-center flex-shrink-0">
          <CircleUser className="w-4 h-4 text-sidebar-active-foreground" />
        </div>
        {!collapsed && (
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">
              {displayName}
            </p>
            <p className="text-xs text-sidebar-foreground/50 capitalize truncate leading-tight mt-0.5">
              {displayRole}
            </p>
          </div>
        )}
      </button>
    </div>
  );
}
