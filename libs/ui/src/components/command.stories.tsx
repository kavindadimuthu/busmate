import type { Meta, StoryObj } from "@storybook/react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "./command";
import { MapPin, Bus, Settings, User, Search, Calendar } from "lucide-react";

const meta: Meta<typeof Command> = {
  title: "Components/Navigation/Command",
  component: Command,
};

export default meta;
type Story = StoryObj<typeof Command>;

export const Default: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md w-[400px]">
      <CommandInput placeholder="Search routes, stops, or commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <MapPin className="mr-2 h-4 w-4" />
            <span>Find Nearest Stop</span>
          </CommandItem>
          <CommandItem>
            <Bus className="mr-2 h-4 w-4" />
            <span>View All Routes</span>
          </CommandItem>
          <CommandItem>
            <Calendar className="mr-2 h-4 w-4" />
            <span>View Schedule</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const WithSearch: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md w-[400px]">
      <CommandInput placeholder="Search bus routes..." />
      <CommandList>
        <CommandEmpty>No matching routes found.</CommandEmpty>
        <CommandGroup heading="Colombo Routes">
          <CommandItem>
            <Bus className="mr-2 h-4 w-4" />
            <span>138 — Colombo Fort → Kaduwela</span>
          </CommandItem>
          <CommandItem>
            <Bus className="mr-2 h-4 w-4" />
            <span>176 — Colombo Fort → Maharagama</span>
          </CommandItem>
          <CommandItem>
            <Bus className="mr-2 h-4 w-4" />
            <span>177 — Colombo Fort → Piliyandala</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Kandy Routes">
          <CommandItem>
            <Bus className="mr-2 h-4 w-4" />
            <span>1 — Colombo → Kandy (Express)</span>
          </CommandItem>
          <CommandItem>
            <Bus className="mr-2 h-4 w-4" />
            <span>47 — Kandy → Dambulla</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
