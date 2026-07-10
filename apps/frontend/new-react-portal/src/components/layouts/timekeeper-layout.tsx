import { RoleGate } from "@/components/layouts/role-gate";
import type { ReactNode } from "react";

export default function TimekeeperRootLayout({ children }: { children: ReactNode }) {
  return <RoleGate role="timekeeper">{children}</RoleGate>;
}
