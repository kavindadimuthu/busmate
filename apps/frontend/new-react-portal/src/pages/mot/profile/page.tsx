import { useEffect, useState } from "react";
import { getUserData } from "@/lib/utils/getUserData";
import { MotProfile } from "@/components/mot/profile";
import type UserData from "@/types/UserData";

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    getUserData().then(setUserData);
  }, []);

  return <MotProfile userData={userData} />;
}
