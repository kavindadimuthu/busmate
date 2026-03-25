import type { Meta, StoryObj } from "@storybook/react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  TableFooter,
} from "./table";

const meta: Meta<typeof Table> = {
  title: "Components/Display/Table",
  component: Table,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Table>;

const routes = [
  { number: "138", name: "Colombo - Kaduwela", status: "Active", buses: 12 },
  { number: "176", name: "Colombo - Kottawa", status: "Active", buses: 8 },
  { number: "47", name: "Kandy - Matale", status: "Suspended", buses: 5 },
  { number: "49", name: "Kandy - Dambulla", status: "Active", buses: 6 },
  { number: "255", name: "Galle - Matara", status: "Draft", buses: 0 },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of bus routes.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Route #</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Buses</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {routes.map((route) => (
          <TableRow key={route.number}>
            <TableCell className="font-medium">{route.number}</TableCell>
            <TableCell>{route.name}</TableCell>
            <TableCell>{route.status}</TableCell>
            <TableCell className="text-right">{route.buses}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">31</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const Simple: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Kavinda Dissanayake</TableCell>
          <TableCell>kavinda@busmate.lk</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Samantha Perera</TableCell>
          <TableCell>samantha@busmate.lk</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
