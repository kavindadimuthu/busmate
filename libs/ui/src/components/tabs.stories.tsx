import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { Bus, MapPin, Clock } from "lucide-react";

const meta: Meta<typeof Tabs> = {
  title: "Components/Navigation/Tabs",
  component: Tabs,
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="routes" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="routes">Routes</TabsTrigger>
        <TabsTrigger value="stops">Stops</TabsTrigger>
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
      </TabsList>
      <TabsContent value="routes" className="p-4">
        <p className="text-sm text-muted-foreground">
          Browse all available bus routes.
        </p>
      </TabsContent>
      <TabsContent value="stops" className="p-4">
        <p className="text-sm text-muted-foreground">
          Find nearby bus stops and their details.
        </p>
      </TabsContent>
      <TabsContent value="schedule" className="p-4">
        <p className="text-sm text-muted-foreground">
          View bus schedules and timings.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

export const LineVariant: Story = {
  render: () => (
    <Tabs defaultValue="routes" className="w-[400px]">
      <TabsList variant="line">
        <TabsTrigger value="routes">Routes</TabsTrigger>
        <TabsTrigger value="stops">Stops</TabsTrigger>
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
      </TabsList>
      <TabsContent value="routes" className="p-4">
        <p className="text-sm text-muted-foreground">
          Line-style tab for routes.
        </p>
      </TabsContent>
      <TabsContent value="stops" className="p-4">
        <p className="text-sm text-muted-foreground">
          Line-style tab for stops.
        </p>
      </TabsContent>
      <TabsContent value="schedule" className="p-4">
        <p className="text-sm text-muted-foreground">
          Line-style tab for schedule.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="routes" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="routes">
          <Bus className="h-4 w-4" />
          Routes
        </TabsTrigger>
        <TabsTrigger value="stops">
          <MapPin className="h-4 w-4" />
          Stops
        </TabsTrigger>
        <TabsTrigger value="schedule">
          <Clock className="h-4 w-4" />
          Schedule
        </TabsTrigger>
      </TabsList>
      <TabsContent value="routes" className="p-4">
        <p className="text-sm text-muted-foreground">Routes with icons.</p>
      </TabsContent>
      <TabsContent value="stops" className="p-4">
        <p className="text-sm text-muted-foreground">Stops with icons.</p>
      </TabsContent>
      <TabsContent value="schedule" className="p-4">
        <p className="text-sm text-muted-foreground">Schedule with icons.</p>
      </TabsContent>
    </Tabs>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="routes" orientation="vertical" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="routes">Routes</TabsTrigger>
        <TabsTrigger value="stops">Stops</TabsTrigger>
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
      </TabsList>
      <TabsContent value="routes" className="p-4">
        <p className="text-sm text-muted-foreground">Vertical tab content.</p>
      </TabsContent>
      <TabsContent value="stops" className="p-4">
        <p className="text-sm text-muted-foreground">Stops content.</p>
      </TabsContent>
      <TabsContent value="schedule" className="p-4">
        <p className="text-sm text-muted-foreground">Schedule content.</p>
      </TabsContent>
    </Tabs>
  ),
};
