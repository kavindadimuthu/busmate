import type React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic';
import { Toaster } from '@/components/ui/toaster'
import { LayoutClient } from '@/components/shared/LayoutClient'
import { getUserData } from '@/lib/utils/getUserData'
import { isRoleAllowedForRoute, getRoleRedirectPath } from '@/lib/utils/getRoleRedirectPath'

export const metadata: Metadata = {
  title: 'BUSMATE LK Timekeeper Portal',
  description: 'Timekeeper portal for BUSMATE LK transportation system',
}

export default async function TimekeeperRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userData = await getUserData();

  if (!userData) {
    redirect('/');
  }

  if (!isRoleAllowedForRoute(userData.user_role, '/timekeeper')) {
    redirect(getRoleRedirectPath(userData.user_role));
  }

  return (
    <>
      <LayoutClient role="timeKeeper" userData={userData}>
        {children}
      </LayoutClient>
      <Toaster />
    </>
  )
}
