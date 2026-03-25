import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { ArrowRight, Loader2, Mail } from "lucide-react";

const meta: Meta<typeof Button> = {
  title: "Components/Form/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link", "success"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    disabled: { control: "boolean" },
    asChild: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: "Button" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Delete" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Secondary" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Ghost" },
};

export const Link: Story = {
  args: { variant: "link", children: "Link" },
};

export const Success: Story = {
  args: { variant: "success", children: "Success" },
};

export const Small: Story = {
  args: { size: "sm", children: "Small" },
};

export const Large: Story = {
  args: { size: "lg", children: "Large" },
};

export const ExtraSmall: Story = {
  args: { size: "xs", children: "XS" },
};

export const Icon: Story = {
  args: { size: "icon", children: <Mail className="h-4 w-4" /> },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Mail className="h-4 w-4" />
        Login with Email
      </>
    ),
  },
};

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Please wait
      </>
    ),
  },
};

export const WithTrailingIcon: Story = {
  args: {
    children: (
      <>
        Next
        <ArrowRight className="h-4 w-4" />
      </>
    ),
  },
};

export const Disabled: Story = {
  args: { disabled: true, children: "Disabled" },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="success">Success</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon"><Mail className="h-4 w-4" /></Button>
      <Button size="icon-xs"><Mail className="h-3 w-3" /></Button>
      <Button size="icon-sm"><Mail className="h-4 w-4" /></Button>
      <Button size="icon-lg"><Mail className="h-5 w-5" /></Button>
    </div>
  ),
};
