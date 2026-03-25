import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "@busmate/ui/layouts/sidebar";
import { Bus, MapPin, Calendar, Users, Settings, BarChart3, Ticket } from "lucide-react";

const meta: Meta<typeof Sidebar> = {
  title: "Layouts/Sidebar",
  component: Sidebar,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

const navigation = [
  {
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: BarChart3, href: "/dashboard" },
      { id: "routes", label: "Routes", icon: Bus, href: "/routes", badge: 12 },
      { id: "stops", label: "Bus Stops", icon: MapPin, href: "/stops" },
      { id: "schedule", label: "Schedule", icon: Calendar, href: "/schedule" },
      { id: "tickets", label: "Tickets", icon: Ticket, href: "/tickets", badge: 3 },
    ],
  },
  {
    label: "Admin",
    items: [
      { id: "users", label: "Users", icon: Users, href: "/users" },
      { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
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

export const Expanded: Story = {
  render: function SidebarExpandedStory() {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <div className="h-[600px] relative">
        <Sidebar
          brand={brand}
          navigation={navigation}
          activeItemId="routes"
          collapsed={collapsed}
          onCollapse={setCollapsed}
        />
      </div>
    );
  },
};

export const Collapsed: Story = {
  render: function SidebarCollapsedStory() {
    const [collapsed, setCollapsed] = useState(true);
    return (
      <div className="h-[600px] relative">
        <Sidebar
          brand={brand}
          navigation={navigation}
          activeItemId="routes"
          collapsed={collapsed}
          onCollapse={setCollapsed}
        />
      </div>
    );
  },
};
