import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AppShell } from "@busmate/ui/layouts";
import { Sidebar } from "@busmate/ui/layouts/sidebar";
import { Header } from "@busmate/ui/layouts/header";
import { Bus, MapPin, Calendar, Users, Settings, BarChart3, Ticket } from "lucide-react";
import { Button } from "../components/button";

const meta: Meta<typeof AppShell> = {
  title: "Layouts/AppShell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof AppShell>;

const navigation = [
  {
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: BarChart3, href: "#" },
      { id: "routes", label: "Routes", icon: Bus, href: "#", badge: 12 },
      { id: "stops", label: "Bus Stops", icon: MapPin, href: "#" },
      { id: "schedule", label: "Schedule", icon: Calendar, href: "#" },
      { id: "tickets", label: "Tickets", icon: Ticket, href: "#" },
    ],
  },
  {
    label: "Admin",
    items: [
      { id: "users", label: "Users", icon: Users, href: "#" },
      { id: "settings", label: "Settings", icon: Settings, href: "#" },
    ],
  },
];

const brand = {
  logo: (
    <div className="flex items-center gap-2">
      <Bus className="h-6 w-6 text-primary" />
      <span className="font-semibold text-lg">BusMate</span>
    </div>
  ),
};

export const Default: Story = {
  render: function AppShellStory() {
    const [collapsed, setCollapsed] = useState(false);

    return (
      <div className="h-[600px]">
        <AppShell
          sidebarCollapsed={collapsed}
          sidebar={
            <Sidebar
              brand={brand}
              navigation={navigation}
              activeItemId="routes"
              collapsed={collapsed}
              onCollapse={setCollapsed}
            />
          }
          header={
            <Header
              title="Routes"
              description="Manage all bus routes"
              breadcrumbs={[{ label: "Routes" }]}
              actions={<Button size="sm">Add Route</Button>}
            />
          }
        >
          <div className="p-6">
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              Page content area
            </div>
          </div>
        </AppShell>
      </div>
    );
  },
};
