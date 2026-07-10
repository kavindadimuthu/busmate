import { Outlet } from "react-router";
import { RoleGate } from "@/components/layouts/role-gate";

export default function MotRootLayout() {
  return (
    <RoleGate role="mot">
      <Outlet />
    </RoleGate>
  );
}
