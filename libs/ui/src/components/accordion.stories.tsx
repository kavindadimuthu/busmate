import type { Meta, StoryObj } from "@storybook/react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./accordion";

const meta: Meta<typeof Accordion> = {
  title: "Components/Navigation/Accordion",
  component: Accordion,
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[400px]">
      <AccordionItem value="route-138">
        <AccordionTrigger>Route 138 — Colombo Fort → Kaduwela</AccordionTrigger>
        <AccordionContent>
          <p className="text-sm text-muted-foreground">
            Operates from 5:00 AM to 10:00 PM. Frequency: every 15 minutes
            during peak hours. Stops include Borella, Rajagiriya, Battaramulla,
            and Kaduwela.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="route-176">
        <AccordionTrigger>Route 176 — Colombo Fort → Maharagama</AccordionTrigger>
        <AccordionContent>
          <p className="text-sm text-muted-foreground">
            Operates from 5:30 AM to 9:30 PM. Frequency: every 20 minutes.
            Stops include Bambalapitiya, Dehiwala, Nugegoda, and Maharagama.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="route-1">
        <AccordionTrigger>Route 1 — Colombo → Kandy (Express)</AccordionTrigger>
        <AccordionContent>
          <p className="text-sm text-muted-foreground">
            Express service with limited stops. Journey time approximately 3
            hours. Departs every 30 minutes from Colombo Fort.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" className="w-[400px]">
      <AccordionItem value="faq-1">
        <AccordionTrigger>How do I track a bus?</AccordionTrigger>
        <AccordionContent>
          Open the BusMate app, search for your route number, and tap "Track".
          You'll see real-time bus locations on the map.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="faq-2">
        <AccordionTrigger>Can I buy tickets through BusMate?</AccordionTrigger>
        <AccordionContent>
          Yes! Navigate to the Tickets section, select your route and journey,
          then complete the payment using any supported method.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="faq-3">
        <AccordionTrigger>What payment methods are supported?</AccordionTrigger>
        <AccordionContent>
          We support credit/debit cards, mobile wallets, and bank transfers.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
