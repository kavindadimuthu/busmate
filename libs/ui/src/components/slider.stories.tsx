import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./slider";

const meta: Meta<typeof Slider> = {
  title: "Components/Form/Slider",
  component: Slider,
  argTypes: {
    disabled: { control: "boolean" },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: { defaultValue: [50], max: 100, step: 1 },
  decorators: [(Story) => <div className="w-[300px]"><Story /></div>],
};

export const Range: Story = {
  args: { defaultValue: [25, 75], max: 100, step: 1 },
  decorators: [(Story) => <div className="w-[300px]"><Story /></div>],
};

export const Disabled: Story = {
  args: { defaultValue: [50], disabled: true },
  decorators: [(Story) => <div className="w-[300px]"><Story /></div>],
};

export const CustomRange: Story = {
  args: { defaultValue: [500], min: 0, max: 1000, step: 50 },
  decorators: [(Story) => <div className="w-[300px]"><Story /></div>],
};
