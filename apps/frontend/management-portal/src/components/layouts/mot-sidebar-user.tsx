"use client";

import { useState, useRef, useEffect } from "react";
import { CircleUser, LogOut, Moon, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import signOut from "@/lib/utils/signOut";
import type UserData from "@/types/UserData";

interface MotSidebarUserProps {
  userData: UserData;
  collapsed: boolean;
}

/**
 * User section rendered at the bottom of the MOT Sidebar.
 * Self-contained — manages its own open/close menu state.
 */
export function MotSidebarUser({ userData, collapsed }: MotSidebarUserProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { setTheme, resolvedTheme } = useTheme();

  // Close menu on outside click
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
  const displayRole = userData.user_role || "MOT";

  return (
    <div className="relative" ref={menuRef}>
      {/* Dropdown menu — opens upward */}
      {menuOpen && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-background rounded-xl shadow-xl border border-border py-1 z-50 min-w-[200px]">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground truncate">{displayEmail}</p>
            <p className="text-xs text-muted-foreground capitalize truncate">{displayRole}</p>
          </div>

          {/* Profile link */}
          <Link
            href="/mot/profile"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <CircleUser className="w-4 h-4 text-muted-foreground" />
            Profile
          </Link>

          {/* Settings link */}
          <Link
            href="/mot/settings"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            Settings
          </Link>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors w-full text-left"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
            {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          <div className="border-t border-border my-1" />

          {/* Sign out */}
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}

      {/* User trigger button */}
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
