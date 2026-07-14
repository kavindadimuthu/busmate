import { useEffect, useState } from "react";
import { getUserData } from "@/lib/utils/getUserData";
import { TimekeeperProfile } from "@/components/timekeeper/profile";
import type UserData from "@/types/UserData";

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    getUserData().then(setUserData);
  }, []);

  return <TimekeeperProfile userData={userData} />;
}
