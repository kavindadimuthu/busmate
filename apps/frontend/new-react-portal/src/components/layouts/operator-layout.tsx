import { Outlet } from "react-router";
import { RoleGate } from "@/components/layouts/role-gate";

export default function OperatorRootLayout() {
  return (
    <RoleGate role="operator">
      <Outlet />
    </RoleGate>
  );
}
