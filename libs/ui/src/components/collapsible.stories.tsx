import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./collapsible";
import { Button } from "./button";
import { ChevronsUpDown } from "lucide-react";

const meta: Meta<typeof Collapsible> = {
  title: "Components/Navigation/Collapsible",
  component: Collapsible,
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: function CollapsibleStory() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[350px] space-y-2">
        <div className="flex items-center justify-between space-x-4 px-4">
          <h4 className="text-sm font-semibold">Route 138 — Stops (7)</h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm">
          Colombo Fort
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border px-4 py-2 font-mono text-sm">
            Borella
          </div>
          <div className="rounded-md border px-4 py-2 font-mono text-sm">
            Rajagiriya
          </div>
          <div className="rounded-md border px-4 py-2 font-mono text-sm">
            Battaramulla
          </div>
          <div className="rounded-md border px-4 py-2 font-mono text-sm">
            Malabe
          </div>
          <div className="rounded-md border px-4 py-2 font-mono text-sm">
            Kaduwela
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};
