import type { Meta, StoryObj } from "@storybook/react";
import { StatusBadge } from "@busmate/ui/patterns/status-badge";

const meta: Meta<typeof StatusBadge> = {
  title: "Patterns/StatusBadge",
  component: StatusBadge,
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

const allStatuses = [
  "active",
  "inactive",
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
  "expired",
  "draft",
  "in-progress",
  "warning",
  "error",
  "info",
];

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {allStatuses.map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
    </div>
  ),
};

export const WithoutDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {allStatuses.map((status) => (
        <StatusBadge key={status} status={status} dot={false} />
      ))}
    </div>
  ),
};

export const CustomLabel: Story = {
  render: () => (
    <StatusBadge status="active" label="Bus Running" />
  ),
};
