import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Input> = {
  title: "Components/Form/Input",
  component: Input,
  argTypes: {
    type: { control: "select", options: ["text", "email", "password", "number", "search", "tel", "url"] },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: "Enter text..." },
};

export const Email: Story = {
  args: { type: "email", placeholder: "name@example.com" },
};

export const Password: Story = {
  args: { type: "password", placeholder: "Enter password" },
};

export const Disabled: Story = {
  args: { placeholder: "Disabled", disabled: true },
};

export const WithValue: Story = {
  args: { defaultValue: "Hello World" },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="name@example.com" />
    </div>
  ),
};

export const File: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="picture">Picture</Label>
      <Input id="picture" type="file" />
    </div>
  ),
};
