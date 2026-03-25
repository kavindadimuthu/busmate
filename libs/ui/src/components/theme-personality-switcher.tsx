"use client";

import * as React from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { useThemePersonality } from "../context/theme-personality-provider";
import { cn } from "../lib/utils";

/**
 * ThemePersonalitySwitcher
 *
 * A dropdown that lets users switch between registered color personalities
 * (Default / Ocean / Slate / …). Compose this alongside the existing
 * <ThemeSwitcher> (which handles light/dark mode) in your app header.
 *
 * Requires <ThemePersonalityProvider> to be present in the component tree.
 *
 * @example
 * <ThemePersonalitySwitcher />
 */
export function ThemePersonalitySwitcher() {
  const { personality, setPersonality, themes } = useThemePersonality();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Switch color theme">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Color Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {themes.map((theme) => {
          const isActive = personality === theme.id;
          return (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => setPersonality(theme.id)}
              className="flex items-center gap-3 cursor-pointer"
            >
              {/* Color swatch */}
              <span
                className="h-4 w-4 rounded-full shrink-0 ring-1 ring-border"
                style={{
                  background: theme.previewColorDark
                    ? `linear-gradient(135deg, ${theme.previewColor} 50%, ${theme.previewColorDark} 50%)`
                    : theme.previewColor,
                }}
                aria-hidden="true"
              />

              <span className="flex-1">
                <span className={cn("text-sm", isActive && "font-medium")}>
                  {theme.label}
                </span>
              </span>

              {isActive && (
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
