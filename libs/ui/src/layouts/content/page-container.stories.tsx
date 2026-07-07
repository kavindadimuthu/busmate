import type { Meta, StoryObj } from "@storybook/react";
import { PageContainer } from "@busmate/ui/layouts/content";
import { Section } from "@busmate/ui/layouts/content";
import { Button } from "../../components/button";

const meta: Meta<typeof PageContainer> = {
  title: "Layouts/Content/PageContainer",
  component: PageContainer,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof PageContainer>;

export const Default: Story = {
  render: () => (
    <PageContainer className="p-6">
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Full width page content
      </div>
    </PageContainer>
  ),
};

export const Constrained: Story = {
  render: () => (
    <PageContainer maxWidth="lg" className="p-6">
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Constrained to max-w-screen-lg
      </div>
    </PageContainer>
  ),
};

export const WithSection: Story = {
  render: () => (
    <PageContainer maxWidth="xl" className="space-y-6 p-6">
      <Section
        title="Active Routes"
        description="All currently running bus routes"
        actions={<Button size="sm">Add Route</Button>}
      >
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Route list content
        </div>
      </Section>

      <Section
        title="Schedule Overview"
        variant="card"
        actions={<Button size="sm" variant="outline">Export</Button>}
      >
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Schedule content inside a card
        </div>
      </Section>
    </PageContainer>
  ),
};
