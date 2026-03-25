import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount } from "./avatar";

const meta: Meta<typeof Avatar> = {
  title: "Components/Display/Avatar",
  component: Avatar,
  argTypes: {
    size: { control: "select", options: ["default", "sm", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://api.dicebear.com/9.x/initials/svg?seed=KD" alt="User" />
      <AvatarFallback>KD</AvatarFallback>
    </Avatar>
  ),
};

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>BM</AvatarFallback>
    </Avatar>
  ),
};

export const Small: Story = {
  render: () => (
    <Avatar size="sm">
      <AvatarFallback>SM</AvatarFallback>
    </Avatar>
  ),
};

export const Large: Story = {
  render: () => (
    <Avatar size="lg">
      <AvatarFallback>LG</AvatarFallback>
    </Avatar>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>KD</AvatarFallback>
      <AvatarBadge className="bg-green-500" />
    </Avatar>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>A</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>B</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>C</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+5</AvatarGroupCount>
    </AvatarGroup>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar>
      <Avatar><AvatarFallback>MD</AvatarFallback></Avatar>
      <Avatar size="lg"><AvatarFallback>LG</AvatarFallback></Avatar>
    </div>
  ),
};
