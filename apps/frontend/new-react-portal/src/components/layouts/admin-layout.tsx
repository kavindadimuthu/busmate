import { RoleGate } from "@/components/layouts/role-gate";
import type { ReactNode } from "react";

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <RoleGate role="admin">{children}</RoleGate>;
}
