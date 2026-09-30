import { formatMoney } from "@/lib/booking/payment.ts";
import type { BookingResult } from "@/lib/booking/BookingContext";

/** What the server charged: per seat and in total. These are the server's figures from the reservation, never worked out here. */
export default function FareSummary({ seats, result }: { seats: string[]; result: BookingResult }) {
  return (
    <section aria-label="Fare" className="rounded-2xl border border-border bg-card p-4 md:p-5">
      <h2 className="text-[15px] font-extrabold">{seats.length === 1 ? "Your seat" : `Your ${seats.length} seats`}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {seats.map((s) => (
          <li key={s} className="grid h-11 min-w-11 place-items-center rounded-lg border-[1.5px] border-primary bg-tint px-3 text-sm font-bold text-primary">
            {s}
          </li>
        ))}
      </ul>
      <dl className="mt-4 grid gap-2 border-t border-border pt-4 text-sm">
        {seats.length > 1 && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">
              {formatMoney(result.farePerSeat)} × {seats.length} seats
            </dt>
            <dd />
          </div>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <dt className="font-bold">Total</dt>
          <dd className="text-2xl font-extrabold tracking-tight">{formatMoney(result.fareAmount)}</dd>
        </div>
      </dl>
    </section>
  );
}
