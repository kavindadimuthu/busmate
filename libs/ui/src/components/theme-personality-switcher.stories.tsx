import type { Meta, StoryObj } from "@storybook/react";
import { ThemePersonalitySwitcher } from "./theme-personality-switcher";

const meta: Meta<typeof ThemePersonalitySwitcher> = {
  title: "Components/Theme/ThemePersonalitySwitcher",
  component: ThemePersonalitySwitcher,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ThemePersonalitySwitcher>;

export const Default: Story = {};
