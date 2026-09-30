// Pure payment-step logic, no React. Erasable TypeScript only so `node --test` can run it.

export interface PayableBooking {
  redirectUrl?: string | null;
  checkoutFields?: Record<string, string> | null;
}

/**
 * How this booking is paid. "hosted" means the server handed back a PayHere checkout to send the passenger to;
 * "dummy" means payments are not switched on (ADR-014) and confirming completes the booking without taking any
 * money. The server's response decides, so nothing here changes when the switch is flipped.
 */
export type PaymentMode = "hosted" | "dummy";

export function paymentMode(b: PayableBooking): PaymentMode {
  return b.checkoutFields && Object.keys(b.checkoutFields).length > 0 && isHttpUrl(b.redirectUrl) ? "hosted" : "dummy";
}

/** Only an absolute http(s) address is ever posted a passenger's browser to. */
export function isHttpUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** "Rs. 1,250.00". Fixed locale so a phone's own settings can't change how an amount reads. */
export function formatMoney(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `Rs. ${safe.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** PayHere sends the passenger back with `order_id=TICKET-<id>`: server state that survives the redirect,
 * unlike anything held in the page. Null for anything else. */
export function ticketIdFromOrderId(orderId: string | null | undefined): number | null {
  const m = orderId?.match(/^TICKET-(\d+)$/);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export const SETTLE_POLL_MS = 2000;
/** About 30 seconds: PayHere's own callback to the server is what settles a payment, and it usually lands sooner. */
export const SETTLE_MAX_POLLS = 15;

export type Settlement = "waiting" | "paid" | "failed" | "slow";

/** Where a payment stands after `polls` checks of the ticket. An unknown status keeps waiting, then gives up as "slow". */
export function settlement(status: string | undefined, polls: number, failedToAsk: boolean): Settlement {
  const s = status?.toUpperCase();
  if (s === "SUCCESS") return "paid";
  if (s === "FAILED" || failedToAsk) return "failed";
  return polls >= SETTLE_MAX_POLLS ? "slow" : "waiting";
}
