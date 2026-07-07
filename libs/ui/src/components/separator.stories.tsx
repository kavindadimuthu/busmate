import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "./separator";

const meta: Meta<typeof Separator> = {
  title: "Components/Display/Separator",
  component: Separator,
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-[300px]">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">BusMate UI</h4>
        <p className="text-sm text-muted-foreground">A shared component library.</p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-4 text-sm">
        <div>Components</div>
        <Separator orientation="vertical" />
        <div>Patterns</div>
        <Separator orientation="vertical" />
        <div>Layouts</div>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center gap-4 text-sm">
      <div>Home</div>
      <Separator orientation="vertical" />
      <div>Routes</div>
      <Separator orientation="vertical" />
      <div>Settings</div>
    </div>
  ),
};
