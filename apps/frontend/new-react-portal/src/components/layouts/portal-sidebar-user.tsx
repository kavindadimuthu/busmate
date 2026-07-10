"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, CircleUser, LogOut, Moon, Palette, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useThemePersonality, THEMES } from "@busmate/ui";
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
  const [colorSubmenuOpen, setColorSubmenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { setTheme, resolvedTheme } = useTheme();
  const { personality, setPersonality } = useThemePersonality();

  useEffect(() => {
    if (!menuOpen) setColorSubmenuOpen(false);
  }, [menuOpen]);

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

          {/* Color Theme — submenu trigger */}
          <div className="relative">
            <button
              onClick={() => setColorSubmenuOpen((o) => !o)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors ${
                colorSubmenuOpen ? "bg-muted text-foreground" : "text-foreground hover:bg-muted"
              }`}
            >
              <Palette className="w-4 h-4 text-muted-foreground" />
              Color Theme
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>

            {/* Flyout submenu */}
            {colorSubmenuOpen && (
              <div className="absolute left-full -top-12 ml-1.5 bg-background rounded-xl shadow-xl border border-border py-1 z-[60] min-w-[190px]">
                {/* <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Color Theme</p>
                </div> */}
                {THEMES.map((theme) => {
                  const isActive = personality === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => { setPersonality(theme.id); setColorSubmenuOpen(false); }}
                      className={`flex items-center gap-3 px-3 py-2.5 w-full text-left transition-colors ${
                        isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {isActive ? (
                        <Check className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <span className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="flex-1 text-sm">{theme.label}</span>
                      <span
                        className="w-9 h-6 rounded-md flex-shrink-0 border border-border/60"
                        style={{
                          background: theme.previewColorDark
                            ? `linear-gradient(135deg, ${theme.previewColor} 50%, ${theme.previewColorDark} 50%)`
                            : theme.previewColor,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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
