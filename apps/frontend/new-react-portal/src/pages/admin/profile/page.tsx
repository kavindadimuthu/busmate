import { getUserData } from '@/lib/utils/getUserData';
import { AdminProfile } from '@/components/admin/profile';

export default async function ProfilePage() {
  const userData = await getUserData();
  return <AdminProfile userData={userData} />;
}
