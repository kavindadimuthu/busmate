import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** The phone's own share sheet where there is one, otherwise a copied link. A passenger checking a bus for a
 * friend is a real use, and it needs nothing from the backend. */
export default function ShareButton({ title, text, className }: { title: string; text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return; // the passenger closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/40 bg-white/12 px-4 text-[13px] font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        className,
      )}
    >
      {copied ? <Check className="h-4 w-4" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
      {copied ? "Link copied" : "Share"}
      <span role="status" className="sr-only">
        {copied ? "Link copied to the clipboard" : ""}
      </span>
    </button>
  );
}
