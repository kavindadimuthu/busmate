import type { Meta, StoryObj } from "@storybook/react";
import { Toaster } from "./sonner";
import { toast } from "sonner";
import { Button } from "./button";

const meta: Meta<typeof Toaster> = {
  title: "Components/Feedback/Sonner",
  component: Toaster,
  decorators: [
    (Story) => (
      <div>
        <Story />
        <Toaster />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Toaster>;

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="default" onClick={() => toast.success("Route saved successfully!")}>
        Success
      </Button>
      <Button variant="destructive" onClick={() => toast.error("Failed to delete route")}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.warning("Bus is running 15 minutes late")}>
        Warning
      </Button>
      <Button variant="secondary" onClick={() => toast.info("New schedule available for Route 138")}>
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
            loading: "Updating schedule...",
            success: "Schedule updated!",
            error: "Failed to update schedule",
          })
        }
      >
        Promise
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast("Route Updated", {
            description: "Route 138 schedule has been modified.",
            action: { label: "Undo", onClick: () => {} },
          })
        }
      >
        With Action
      </Button>
    </div>
  ),
};
