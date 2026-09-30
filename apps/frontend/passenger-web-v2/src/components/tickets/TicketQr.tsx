import { QRCodeSVG } from "qrcode.react";

/** The boarding code the conductor scans. Always black on white with a quiet border, whatever the theme:
 * a scanner can't read a code that has been dark-moded. */
export default function TicketQr({ value }: { value: string }) {
  return (
    <div className="grid justify-items-center gap-2">
      <div className="rounded-xl border border-border bg-white p-3">
        <QRCodeSVG value={value} size={176} level="M" bgColor="#ffffff" fgColor="#000000" role="img" aria-label="Boarding QR code" />
      </div>
      <p className="text-center text-xs text-muted-foreground">Show this to the conductor when you board</p>
    </div>
  );
}
