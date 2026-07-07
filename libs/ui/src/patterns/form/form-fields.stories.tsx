"use client"

import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "../../components/form";
import { Button } from "../../components/button";
import {
  CheckboxField,
  DatePickerField,
  DateRangePickerField,
  InputField,
  RadioGroupField,
  SelectField,
  SwitchField,
  TextareaField,
} from "./form-fields";

const meta: Meta = {
  title: "Patterns/FormFields",
};

export default meta;

// ── All field types demo ──────────────────────────────────

const schema = z.object({
  routeName: z.string().min(2, "Route name is required"),
  region: z.string().min(1, "Region is required"),
  description: z.string().optional(),
  status: z.enum(["active", "draft", "inactive"]),
  isExpress: z.boolean().default(false),
  sendNotifications: z.boolean().default(false),
  operatingDate: z.date().optional(),
  activePeriod: z
    .object({ from: z.date(), to: z.date().optional() })
    .optional(),
});

type FormValues = z.infer<typeof schema>;

export const AllFields: StoryObj = {
  render: () => {
    const form = useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        routeName: "",
        region: "",
        description: "",
        status: "draft",
        isExpress: false,
        sendNotifications: false,
      },
    });

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) =>
            alert(JSON.stringify(data, null, 2))
          )}
          className="max-w-lg space-y-6"
        >
          <InputField
            control={form.control}
            name="routeName"
            label="Route Name"
            placeholder="e.g. Colombo Fort → Kaduwela"
            description="The official name of the bus route."
          />

          <SelectField
            control={form.control}
            name="region"
            label="Region"
            placeholder="Select region..."
            options={[
              { value: "western", label: "Western Province" },
              { value: "central", label: "Central Province" },
              { value: "southern", label: "Southern Province" },
            ]}
          />

          <TextareaField
            control={form.control}
            name="description"
            label="Description"
            placeholder="Optional notes about this route..."
            rows={3}
          />

          <RadioGroupField
            control={form.control}
            name="status"
            label="Status"
            options={[
              { value: "active", label: "Active" },
              { value: "draft", label: "Draft" },
              { value: "inactive", label: "Inactive" },
            ]}
          />

          <CheckboxField
            control={form.control}
            name="isExpress"
            label="Express Route"
            description="Express routes skip intermediate stops."
          />

          <SwitchField
            control={form.control}
            name="sendNotifications"
            label="Send passenger notifications"
            description="Passengers with saved favourites will be notified of changes."
          />

          <DatePickerField
            control={form.control}
            name="operatingDate"
            label="Operating From"
            placeholder="Pick a start date"
          />

          <DateRangePickerField
            control={form.control}
            name="activePeriod"
            label="Active Period"
            placeholder="Pick date range"
          />

          <Button type="submit">Save Route</Button>
        </form>
      </Form>
    );
  },
};

// ── Validation error states ───────────────────────────────

export const ValidationErrors: StoryObj = {
  render: () => {
    const form = useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        routeName: "",
        region: "",
        status: "draft",
        isExpress: false,
        sendNotifications: false,
      },
    });

    React.useEffect(() => {
      form.trigger(["routeName", "region"]);
    }, [form]);

    return (
      <Form {...form}>
        <form className="max-w-sm space-y-4">
          <InputField
            control={form.control}
            name="routeName"
            label="Route Name"
            placeholder="e.g. Colombo Fort → Kaduwela"
          />
          <SelectField
            control={form.control}
            name="region"
            label="Region"
            placeholder="Select region..."
            options={[
              { value: "western", label: "Western Province" },
              { value: "central", label: "Central Province" },
            ]}
          />
        </form>
      </Form>
    );
  },
};
