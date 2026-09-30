import { cn } from "@/lib/utils";

const BASE = "inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
export const noticePrimary = cn(BASE, "bg-primary text-primary-foreground hover:bg-primary-hover");
export const noticeSecondary = cn(BASE, "border-[1.5px] border-primary text-primary hover:bg-primary hover:text-primary-foreground");
