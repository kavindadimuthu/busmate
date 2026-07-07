import type { Meta, StoryObj } from "@storybook/react";
import { DashboardGrid } from "@busmate/ui/patterns/dashboard";
import { StatsCard, StatsCardGrid } from "@busmate/ui/patterns/stats-card";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/card";
import { Bus, MapPin, Users, Clock } from "lucide-react";

const meta: Meta<typeof DashboardGrid> = {
  title: "Patterns/DashboardGrid",
  component: DashboardGrid,
};

export default meta;
type Story = StoryObj<typeof DashboardGrid>;

export const Default: Story = {
  render: () => (
    <div className="space-y-6">
      <StatsCardGrid>
        <StatsCard title="Total Routes" value={248} icon={<Bus className="h-4 w-4" />} />
        <StatsCard title="Bus Stops" value="3,842" icon={<MapPin className="h-4 w-4" />} />
        <StatsCard title="Passengers Today" value="45.2K" icon={<Users className="h-4 w-4" />} />
        <StatsCard title="On-Time Rate" value="94.7%" icon={<Clock className="h-4 w-4" />} />
      </StatsCardGrid>
      <DashboardGrid>
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Route Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Chart placeholder
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Activity log placeholder
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle>Passenger Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px] flex items-center justify-center text-muted-foreground">
              Chart placeholder
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle>Top Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px] flex items-center justify-center text-muted-foreground">
              Table placeholder
            </div>
          </CardContent>
        </Card>
      </DashboardGrid>
    </div>
  ),
};
