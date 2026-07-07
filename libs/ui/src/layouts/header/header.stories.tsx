import type { Meta, StoryObj } from "@storybook/react";
import { Header } from "@busmate/ui/layouts/header";
import { Button } from "../../components/button";
import { Plus } from "lucide-react";

const meta: Meta<typeof Header> = {
  title: "Layouts/Header",
  component: Header,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {
    title: "Routes",
    description: "Manage all bus routes across the network",
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    title: "Route 138",
    description: "Colombo Fort → Kaduwela",
    breadcrumbs: [
      { label: "Routes", href: "/routes" },
      { label: "Route 138" },
    ],
  },
};

export const WithActions: Story = {
  args: {
    title: "Bus Stops",
    description: "All registered bus stops",
    breadcrumbs: [
      { label: "Network", href: "/network" },
      { label: "Bus Stops" },
    ],
    actions: (
      <Button size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Add Stop
      </Button>
    ),
  },
};
