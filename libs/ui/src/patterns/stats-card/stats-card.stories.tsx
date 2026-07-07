import type { Meta, StoryObj } from "@storybook/react";
import { StatsCard, StatsCardGrid } from "@busmate/ui/patterns/stats-card";
import { Bus, MapPin, Users, Clock } from "lucide-react";

const meta: Meta<typeof StatsCard> = {
  title: "Patterns/StatsCard",
  component: StatsCard,
};

export default meta;
type Story = StoryObj<typeof StatsCard>;

export const Default: Story = {
  args: {
    title: "Total Routes",
    value: 248,
    icon: <Bus className="h-4 w-4" />,
    description: "Across all regions",
  },
};

export const WithTrendUp: Story = {
  args: {
    title: "Active Passengers",
    value: "12,458",
    icon: <Users className="h-4 w-4" />,
    trend: { value: 12.5, direction: "up", label: "vs last month" },
  },
};

export const WithTrendDown: Story = {
  args: {
    title: "Avg Wait Time",
    value: "8.2 min",
    icon: <Clock className="h-4 w-4" />,
    trend: { value: 3.1, direction: "down", label: "vs last week" },
  },
};

export const Grid: Story = {
  render: () => (
    <StatsCardGrid>
      <StatsCard
        title="Total Routes"
        value={248}
        icon={<Bus className="h-4 w-4" />}
        trend={{ value: 5, direction: "up", label: "this month" }}
      />
      <StatsCard
        title="Bus Stops"
        value="3,842"
        icon={<MapPin className="h-4 w-4" />}
        trend={{ value: 12, direction: "up" }}
      />
      <StatsCard
        title="Daily Passengers"
        value="45.2K"
        icon={<Users className="h-4 w-4" />}
        trend={{ value: 2.3, direction: "down" }}
      />
      <StatsCard
        title="On-Time Rate"
        value="94.7%"
        icon={<Clock className="h-4 w-4" />}
        trend={{ value: 0, direction: "neutral" }}
      />
    </StatsCardGrid>
  ),
};
