import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function BrandMark({ tagline = false, className }: { tagline?: boolean; className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-lg text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:gap-2.5",
        className,
      )}
    >
      <span className="grid h-10 w-10 place-items-center rounded-[11px] bg-gradient-to-br from-[#2563eb] to-[#1e40af] text-base font-extrabold text-white">
        B
      </span>
      <span>
        <span className="block text-lg font-extrabold leading-none">BusMate</span>
        {/* The tagline only fits beside the actions on tablet and up. */}
        {tagline && (
          <span className="mt-1 hidden text-[10px] leading-none text-muted-foreground md:block">Your Journey Our Priority</span>
        )}
      </span>
    </Link>
  );
}
