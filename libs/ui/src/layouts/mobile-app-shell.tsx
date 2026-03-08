"use client";

import * as React from "react";
import { Sheet, SheetContent } from "../components/sheet";
import { Button } from "../components/button";
import { Menu } from "lucide-react";

interface MobileAppShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}

export function MobileAppShell({ sidebar, header, children }: MobileAppShellProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar as sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <>{sidebar}</>
        </SheetContent>
      </Sheet>

      {/* Header with hamburger */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-2 p-4">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">{header}</div>
        </div>
      </div>

      {/* Content */}
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}
