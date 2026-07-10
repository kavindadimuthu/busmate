import { getUserData } from '@/lib/utils/getUserData';
import { OperatorProfile } from '@/components/operator/profile';

export default async function ProfilePage() {
  const userData = await getUserData();
  return <OperatorProfile userData={userData} />;
}
