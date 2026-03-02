import Image from 'next/image';
import { SignInButton, SignedIn, SignOutButton, SignedOut } from '@asgardeo/nextjs';
import { getUserData } from '@/lib/utils/getUserData';
import { getRoleRedirectPath } from '@/lib/utils/getRoleRedirectPath';
import { redirect } from 'next/navigation';

export default async function Home() {
  const userData = await getUserData();

  // Authenticated users are redirected to their role-specific dashboard
  if (userData) {
    redirect(getRoleRedirectPath(userData.user_role));
  }

  return (
    <div className="min-h-screen flex items-center justify-end p-4 relative overflow-hidden">
      {/* Background image with low transparency */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95 "
          style={{
            backgroundImage: 'url(/images/background/landing-page-background.png)',
          }}
        ></div>

        {/* Enhanced overlay for better contrast on the right side */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-gray-900/70"></div>
      </div>

      {/* Login Form - positioned on the right with enhanced visibility */}
      <div className="relative z-10 p-8 w-full max-w-lg mr-20 lg:mr-40 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
        {/* Logo and Title */}
        <div className="flex items-center justify-center mb-2">
          <Image
            src="/images/logo/busmate-icon-old.svg"
            alt="Busmate LK"
            width={32}
            height={32}
            className="w-35 h-20 text-white"
          />
        </div>

        {/* Welcome text */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-white mb-2 drop-shadow-2xl">
            Welcome to the Smart Bus Transport Management System{' '}
          </h2>
          <p className="text-white text-sm drop-shadow-lg">
            Click the button below to access Busmate Management Portal
          </p>
        </div>

        {/* Login Form */}
        <div className='flex w-full pt-0 pb-4 justify-center'>
          <SignedOut>
            <SignInButton>
              Sign In with Asgardeo
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <SignOutButton />
          </SignedIn>
        </div>
      </div>
    </div>
  );
}

