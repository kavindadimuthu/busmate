import { Outlet } from "react-router";
import { RoleGate } from "@/components/layouts/role-gate";

export default function TimekeeperRootLayout() {
  return (
    <RoleGate role="timekeeper">
      <Outlet />
    </RoleGate>
  );
}
