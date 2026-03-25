"use client"

import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react";
import type { DateRange as DateRangeValue } from "react-day-picker";
import { DatePicker, DateRangePicker } from "./date-picker";

const meta: Meta = {
  title: "Components/Form/DatePicker",
};

export default meta;

export const Simple: StoryObj = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(undefined);
    return (
      <div className="w-72">
        <DatePicker
          value={date}
          onChange={setDate}
          placeholder="Select a date"
        />
        {date && (
          <p className="mt-2 text-sm text-muted-foreground">
            Selected: {date.toLocaleDateString()}
          </p>
        )}
      </div>
    );
  },
};

export const WithDefaultValue: StoryObj = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    return (
      <div className="w-72">
        <DatePicker value={date} onChange={setDate} />
      </div>
    );
  },
};

export const Disabled: StoryObj = {
  render: () => (
    <div className="w-72">
      <DatePicker
        value={new Date()}
        onChange={() => {}}
        disabled
        placeholder="No date available"
      />
    </div>
  ),
};

export const DateRange: StoryObj = {
  render: () => {
    const [range, setRange] = React.useState<DateRangeValue | undefined>(undefined);
    return (
      <div className="w-full max-w-sm">
        <DateRangePicker
          value={range}
          onChange={setRange}
          placeholder="Pick a travel date range"
          numberOfMonths={2}
        />
        {range?.from && (
          <p className="mt-2 text-sm text-muted-foreground">
            From: {range.from.toLocaleDateString()} —{" "}
            {range.to ? range.to.toLocaleDateString() : "..."}
          </p>
        )}
      </div>
    );
  },
};
