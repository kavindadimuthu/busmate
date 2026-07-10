import { RoleGate } from "@/components/layouts/role-gate";
import type { ReactNode } from "react";

export default function OperatorRootLayout({ children }: { children: ReactNode }) {
  return <RoleGate role="operator">{children}</RoleGate>;
}
