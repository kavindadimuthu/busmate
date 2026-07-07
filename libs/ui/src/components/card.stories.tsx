import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "./card";
import { Button } from "./button";

const meta: Meta<typeof Card> = {
  title: "Components/Display/Card",
  component: Card,
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content area. Put anything here.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Route Statistics</CardTitle>
        <CardDescription>Overview of route performance</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">View All</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">1,247</p>
        <p className="text-sm text-muted-foreground">Active passengers today</p>
      </CardContent>
    </Card>
  ),
};

export const Simple: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">You have 3 unread messages.</p>
      </CardContent>
    </Card>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Create Route</CardTitle>
        <CardDescription>Add a new bus route to the system.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Route Name</label>
          <input className="w-full rounded-md border border-input px-3 py-2 text-sm" placeholder="e.g., 138 - Colombo to Kaduwela" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Route Number</label>
          <input className="w-full rounded-md border border-input px-3 py-2 text-sm" placeholder="e.g., 138" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Create</Button>
      </CardFooter>
    </Card>
  ),
};
