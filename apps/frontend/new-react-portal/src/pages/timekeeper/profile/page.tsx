import { getUserData } from '@/lib/utils/getUserData';
import { TimekeeperProfile } from '@/components/timekeeper/profile';

export default async function ProfilePage() {
  const userData = await getUserData();
  return <TimekeeperProfile userData={userData} />;
}
