import type { Meta, StoryObj } from "@storybook/react";
import { Toggle } from "./toggle";
import { Bold, Italic, Underline } from "lucide-react";

const meta: Meta<typeof Toggle> = {
  title: "Components/Form/Toggle",
  component: Toggle,
  argTypes: {
    variant: { control: "select", options: ["default", "outline"] },
    size: { control: "select", options: ["default", "sm", "lg"] },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  args: { children: <Bold className="h-4 w-4" />, "aria-label": "Toggle bold" },
};

export const Outline: Story = {
  args: { variant: "outline", children: <Italic className="h-4 w-4" />, "aria-label": "Toggle italic" },
};

export const WithText: Story = {
  args: {
    children: (
      <>
        <Bold className="h-4 w-4" />
        Bold
      </>
    ),
  },
};

export const Small: Story = {
  args: { size: "sm", children: <Bold className="h-4 w-4" /> },
};

export const Large: Story = {
  args: { size: "lg", children: <Bold className="h-4 w-4" /> },
};

export const Disabled: Story = {
  args: { disabled: true, children: <Underline className="h-4 w-4" /> },
};
