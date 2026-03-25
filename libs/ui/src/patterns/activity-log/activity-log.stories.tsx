import type { Meta, StoryObj } from "@storybook/react";
import { ActivityLog } from "@busmate/ui/patterns/activity-log";
import type { ActivityItem } from "@busmate/ui/patterns/activity-log";
import { Bus, MapPin, Plus, Edit, Trash2 } from "lucide-react";

const meta: Meta<typeof ActivityLog> = {
  title: "Patterns/ActivityLog",
  component: ActivityLog,
};

export default meta;
type Story = StoryObj<typeof ActivityLog>;

const items: ActivityItem[] = [
  {
    id: "1",
    icon: <Plus className="h-3 w-3" />,
    title: "Route 138 created",
    description: "New route: Colombo Fort → Kaduwela with 12 stops",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    actor: "Kavinda",
  },
  {
    id: "2",
    icon: <Edit className="h-3 w-3" />,
    title: "Route 176 schedule updated",
    description: "Peak hours frequency changed from 20 to 15 minutes",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    actor: "Nimal",
  },
  {
    id: "3",
    icon: <MapPin className="h-3 w-3" />,
    title: "New stop added to Route 1",
    description: "Added Mawanella Junction between Kegalle and Kadugannawa",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    actor: "Kavinda",
  },
  {
    id: "4",
    icon: <Trash2 className="h-3 w-3" />,
    title: "Route 255 deactivated",
    description: "Negombo → Colombo route temporarily suspended",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    actor: "Admin",
  },
  {
    id: "5",
    icon: <Bus className="h-3 w-3" />,
    title: "Bus NB-1234 assigned to Route 47",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    actor: "System",
  },
];

export const Default: Story = {
  args: {
    items,
  },
};
