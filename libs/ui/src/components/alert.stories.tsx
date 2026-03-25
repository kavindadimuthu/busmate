import type { Meta, StoryObj } from "@storybook/react";
import {
  Alert,
  AlertDestructiveIcon,
  AlertDescription,
  AlertInfoIcon,
  AlertSuccessIcon,
  AlertTitle,
  AlertWarningIcon,
} from "./alert";

const meta: Meta<typeof Alert> = {
  title: "Components/Feedback/Alert",
  component: Alert,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "warning", "success", "info"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: () => (
    <Alert>
      <AlertTitle>System Notice</AlertTitle>
      <AlertDescription>
        Scheduled maintenance will occur on Sunday from 2:00 AM to 4:00 AM.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertDestructiveIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Failed to load bus schedule data. Please try again or contact support.
      </AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  render: () => (
    <Alert variant="warning">
      <AlertWarningIcon />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        Route 138 has not been updated in 30 days. Please review and confirm the
        schedule is still accurate.
      </AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  render: () => (
    <Alert variant="success">
      <AlertSuccessIcon />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>
        Permit PERM-2024-0891 has been approved and issued successfully.
      </AlertDescription>
    </Alert>
  ),
};

export const Info: Story = {
  render: () => (
    <Alert variant="info">
      <AlertInfoIcon />
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>
        4 new permit applications are awaiting review. Visit the Permits section
        to process them.
      </AlertDescription>
    </Alert>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-lg">
      <Alert>
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>A standard informational alert.</AlertDescription>
      </Alert>
      <Alert variant="info">
        <AlertInfoIcon />
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>An informational alert with an icon.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertSuccessIcon />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Operation completed successfully.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertWarningIcon />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Action required — please review.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertDestructiveIcon />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    </div>
  ),
};
