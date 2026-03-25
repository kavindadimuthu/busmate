import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { Separator } from "./separator";

const meta: Meta<typeof ScrollArea> = {
  title: "Components/Display/ScrollArea",
  component: ScrollArea,
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

const tags = Array.from({ length: 50 }, (_, i) => `Route ${i + 1}`);

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-[200px] w-[250px] rounded-md border p-4">
      <h4 className="mb-4 text-sm font-medium leading-none">Bus Routes</h4>
      {tags.map((tag) => (
        <div key={tag}>
          <div className="text-sm">{tag}</div>
          <Separator className="my-2" />
        </div>
      ))}
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-[400px] whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="flex h-20 w-32 shrink-0 items-center justify-center rounded-md border bg-muted"
          >
            Stop {i + 1}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};
