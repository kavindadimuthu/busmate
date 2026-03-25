import type { Meta, StoryObj } from "@storybook/react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";

const meta: Meta<typeof ToggleGroup> = {
  title: "Components/Form/ToggleGroup",
  component: ToggleGroup,
  argTypes: {
    variant: { control: "select", options: ["default", "outline"] },
    size: { control: "select", options: ["default", "sm", "lg"] },
    type: { control: "select", options: ["single", "multiple"] },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Single: Story = {
  args: { type: "single", defaultValue: "center" },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Multiple: Story = {
  args: { type: "multiple", defaultValue: ["left", "center"] },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="justify" aria-label="Align justify">
        <AlignJustify className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Outline: Story = {
  args: { type: "single", variant: "outline" },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Small: Story = {
  args: { type: "single", size: "sm" },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};
