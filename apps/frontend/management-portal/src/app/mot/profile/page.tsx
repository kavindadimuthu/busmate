import { getUserData } from '@/lib/utils/getUserData';
import { MotProfile } from '@/components/mot/profile';

export default async function ProfilePage() {
  const userData = await getUserData();
  return <MotProfile userData={userData} />;
}
