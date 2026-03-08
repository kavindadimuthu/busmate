// libs/ui/src/patterns/status-badge/status-badge.tsx

import { Badge } from "@/components/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "active" | "inactive" | "pending" | "approved" | "rejected"
  | "completed" | "cancelled" | "expired" | "draft" | "in-progress"
  | "warning" | "error" | "info";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active:        { label: "Active",      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" },
  inactive:      { label: "Inactive",    className: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400" },
  pending:       { label: "Pending",     className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" },
  approved:      { label: "Approved",    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" },
  rejected:      { label: "Rejected",    className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" },
  completed:     { label: "Completed",   className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" },
  cancelled:     { label: "Cancelled",   className: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400" },
  expired:       { label: "Expired",     className: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" },
  draft:         { label: "Draft",       className: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400" },
  "in-progress": { label: "In Progress", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" },
  warning:       { label: "Warning",     className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" },
  error:         { label: "Error",       className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" },
  info:          { label: "Info",        className: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400" },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ status, label, dot = true, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/_/g, "-") as StatusType;
  const config = statusConfig[normalized] ?? statusConfig.info;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium border-0",
        config.className,
        className
      )}
    >
      {dot && (
        <span
          className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", {
            "bg-emerald-500": normalized === "active" || normalized === "completed",
            "bg-gray-400": normalized === "inactive" || normalized === "cancelled",
            "bg-amber-500": normalized === "pending" || normalized === "warning",
            "bg-blue-500": normalized === "approved" || normalized === "in-progress" || normalized === "info",
            "bg-red-500": normalized === "rejected" || normalized === "error",
            "bg-orange-500": normalized === "expired",
            "bg-slate-400": normalized === "draft",
          })}
        />
      )}
      {label ?? config.label}
    </Badge>
  );
}
