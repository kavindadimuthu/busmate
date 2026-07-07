import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ConfirmDialog, FormDialog, useDialog } from "@busmate/ui/patterns/dialogs";
import { Button } from "../../components/button";
import { Input } from "../../components/input";
import { Label } from "../../components/label";

const meta: Meta = {
  title: "Patterns/Dialogs",
};

export default meta;

export const Confirm: StoryObj = {
  render: function ConfirmDialogStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Deactivate Route</Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Deactivate Route 138?"
          description="This will stop the route from appearing in passenger search results. You can reactivate it later."
          confirmLabel="Deactivate"
          variant="default"
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};

export const Destructive: StoryObj = {
  render: function DestructiveDialogStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete Route
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Delete Route 255?"
          description="This action cannot be undone. All schedule data and stop assignments will be permanently removed."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};

export const Warning: StoryObj = {
  render: function WarningDialogStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Merge Routes
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Merge Routes?"
          description="This will combine Route 138 and 139 into a single route. Passengers on the old routes will be migrated."
          confirmLabel="Merge"
          variant="warning"
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};

export const FormDialogStory: StoryObj = {
  name: "Form Dialog",
  render: function FormDialogDemo() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Add New Stop</Button>
        <FormDialog
          open={open}
          onOpenChange={setOpen}
          title="Add Bus Stop"
          description="Enter the details for the new bus stop."
          size="md"
        >
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="stopName">Stop Name</Label>
              <Input id="stopName" placeholder="e.g. Rajagiriya Junction" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input id="lat" placeholder="6.9071" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input id="lng" placeholder="79.8612" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save Stop</Button>
            </div>
          </div>
        </FormDialog>
      </>
    );
  },
};
