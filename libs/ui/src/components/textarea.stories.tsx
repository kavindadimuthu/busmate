import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./textarea";
import { Label } from "./label";

const meta: Meta<typeof Textarea> = {
  title: "Components/Form/Textarea",
  component: Textarea,
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: { placeholder: "Type your message here..." },
};

export const Disabled: Story = {
  args: { placeholder: "Disabled", disabled: true },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder="Type your message here..." />
    </div>
  ),
};

export const WithValue: Story = {
  args: {
    defaultValue:
      "This is a pre-filled textarea with some content to show how it looks with text inside.",
  },
};
