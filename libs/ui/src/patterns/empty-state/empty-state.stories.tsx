import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "@busmate/ui/patterns/empty-state";
import { Bus, Search, MapPin } from "lucide-react";

const meta: Meta<typeof EmptyState> = {
  title: "Patterns/EmptyState",
  component: EmptyState,
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: "No routes found",
    description: "There are no bus routes matching your search criteria. Try adjusting your filters.",
    icon: <Bus className="h-6 w-6" />,
    action: { label: "Add New Route", onClick: () => {} },
  },
};

export const SearchEmpty: Story = {
  args: {
    title: "No search results",
    description: "We couldn't find any routes matching your query. Try different keywords.",
    icon: <Search className="h-6 w-6" />,
  },
};

export const NoStops: Story = {
  args: {
    title: "No stops added yet",
    description: "Start building this route by adding bus stops.",
    icon: <MapPin className="h-6 w-6" />,
    action: { label: "Add First Stop", onClick: () => {} },
  },
};
