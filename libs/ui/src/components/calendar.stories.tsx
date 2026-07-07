import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Calendar } from "./calendar";
import type { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

const meta: Meta<typeof Calendar> = {
  title: "Components/Display/Calendar",
  component: Calendar,
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: function CalendarStory() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
    );
  },
};

export const Range: Story = {
  render: function CalendarRangeStory() {
    const [range, setRange] = useState<DateRange | undefined>({
      from: new Date(),
      to: addDays(new Date(), 7),
    });
    return (
      <Calendar
        mode="range"
        selected={range}
        onSelect={setRange}
        numberOfMonths={2}
        className="rounded-md border"
      />
    );
  },
};

export const Disabled: Story = {
  render: function CalendarDisabledStory() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={(d) => d < new Date()}
        className="rounded-md border"
      />
    );
  },
};

export const WithDropdowns: Story = {
  render: function CalendarDropdownStory() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        captionLayout="dropdown"
        className="rounded-md border"
      />
    );
  },
};
