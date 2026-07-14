import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Navigate } from "@/lib/router";
import { Toaster } from "@busmate/ui";
import { RoleLayoutClient } from "@/components/layouts/role-layout-client";
import { getUserData } from "@/lib/utils/getUserData";
import { getRoleRedirectPath, isRoleAllowedForRoute } from "@/lib/utils/getRoleRedirectPath";
import type UserData from "@/types/UserData";

interface RoleGateProps {
  children: ReactNode;
  role: "mot" | "admin" | "operator" | "timekeeper";
}

export function RoleGate({ children, role }: RoleGateProps) {
  const [userData, setUserData] = useState<UserData | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    getUserData().then((data) => {
      if (active) setUserData(data);
    });

    return () => {
      active = false;
    };
  }, []);

  if (userData === undefined) {
    return null;
  }

  if (!userData) {
    return <Navigate to="/" replace />;
  }

  if (!isRoleAllowedForRoute(userData.user_role, `/${role}`)) {
    return <Navigate to={getRoleRedirectPath(userData.user_role)} replace />;
  }

  return (
    <>
      <RoleLayoutClient role={role} userData={userData}>
        {children}
      </RoleLayoutClient>
      <Toaster />
    </>
  );
}
