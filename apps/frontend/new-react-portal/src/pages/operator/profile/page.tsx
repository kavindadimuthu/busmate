import { useEffect, useState } from "react";
import { getUserData } from "@/lib/utils/getUserData";
import { OperatorProfile } from "@/components/operator/profile";
import type UserData from "@/types/UserData";

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    getUserData().then(setUserData);
  }, []);

  return <OperatorProfile userData={userData} />;
}
