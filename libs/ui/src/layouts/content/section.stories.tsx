import type { Meta, StoryObj } from "@storybook/react";
import { Section } from "@busmate/ui/layouts/content";
import { Button } from "../../components/button";

const meta: Meta<typeof Section> = {
  title: "Layouts/Content/Section",
  component: Section,
};

export default meta;
type Story = StoryObj<typeof Section>;

export const Flat: Story = {
  render: () => (
    <Section
      title="Bus Stops"
      description="Manage stops along Route 138"
      actions={<Button size="sm">Add Stop</Button>}
    >
      <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
        Stops content area
      </div>
    </Section>
  ),
};

export const Card: Story = {
  render: () => (
    <Section
      title="Route Details"
      description="Overview of route configuration"
      variant="card"
      actions={<Button size="sm" variant="outline">Edit</Button>}
    >
      <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
        Card-wrapped section content
      </div>
    </Section>
  ),
};
