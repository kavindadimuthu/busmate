import { Outlet } from "react-router";
import { RoleGate } from "@/components/layouts/role-gate";

export default function AdminRootLayout() {
  return (
    <RoleGate role="admin">
      <Outlet />
    </RoleGate>
  );
}
