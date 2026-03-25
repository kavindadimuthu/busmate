import type { Meta, StoryObj } from "@storybook/react";
import { FormSection } from "@busmate/ui/patterns/form";
import { FormGrid } from "@busmate/ui/patterns/form";
import { Input } from "../../components/input";
import { Label } from "../../components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/select";
import { Textarea } from "../../components/textarea";

const meta: Meta = {
  title: "Patterns/Form",
};

export default meta;

export const SectionAndGrid: StoryObj = {
  render: () => (
    <div className="max-w-3xl space-y-6">
      <FormSection title="Route Details" description="Basic information about the bus route.">
        <FormGrid columns={2}>
          <div className="space-y-2">
            <Label htmlFor="routeNumber">Route Number</Label>
            <Input id="routeNumber" placeholder="e.g. 138" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="routeName">Route Name</Label>
            <Input id="routeName" placeholder="e.g. Colombo Fort → Kaduwela" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select>
              <SelectTrigger id="region">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="western">Western Province</SelectItem>
                <SelectItem value="central">Central Province</SelectItem>
                <SelectItem value="southern">Southern Province</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FormGrid>
      </FormSection>

      <FormSection title="Schedule" description="Configure the operating schedule.">
        <FormGrid columns={3}>
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input id="startTime" type="time" defaultValue="05:00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input id="endTime" type="time" defaultValue="22:00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency (min)</Label>
            <Input id="frequency" type="number" defaultValue="15" />
          </div>
        </FormGrid>
      </FormSection>

      <FormSection title="Notes">
        <FormGrid columns={1}>
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea id="notes" placeholder="Any special instructions or notes about this route..." />
          </div>
        </FormGrid>
      </FormSection>
    </div>
  ),
};
