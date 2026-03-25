"use client"

import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";
import { Button } from "./button";

const meta: Meta = {
  title: "Components/Form/FormPrimitives",
};

export default meta;

// ── Basic field example ───────────────────────────────────

const schema = z.object({
  operatorName: z.string().min(2, "Name must be at least 2 characters"),
  licenseNumber: z.string().min(5, "License number is required"),
  email: z.string().email("Invalid email address"),
});

export const BasicField: StoryObj = {
  render: () => {
    const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: { operatorName: "", licenseNumber: "", email: "" },
    });

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => alert(JSON.stringify(data, null, 2)))}
          className="max-w-sm space-y-4"
        >
          <FormField
            control={form.control}
            name="operatorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operator Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Lanka Transport Ltd." {...field} />
                </FormControl>
                <FormDescription>
                  The registered company or individual name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="licenseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. OP-2024-0192" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="operator@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Save Operator</Button>
        </form>
      </Form>
    );
  },
};

export const WithValidationErrors: StoryObj = {
  render: () => {
    const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: { operatorName: "", licenseNumber: "", email: "not-an-email" },
    });

    // Trigger errors on mount to showcase validation states
    React.useEffect(() => {
      form.trigger();
    }, [form]);

    return (
      <Form {...form}>
        <form className="max-w-sm space-y-4">
          <FormField
            control={form.control}
            name="operatorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operator Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Lanka Transport Ltd." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  },
};
