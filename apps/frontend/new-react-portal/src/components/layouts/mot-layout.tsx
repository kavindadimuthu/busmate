import { RoleGate } from "@/components/layouts/role-gate";
import type { ReactNode } from "react";

export default function MotRootLayout({ children }: { children: ReactNode }) {
  return <RoleGate role="mot">{children}</RoleGate>;
}
