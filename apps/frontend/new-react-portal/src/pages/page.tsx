import { useEffect } from "react";
import { useRouter } from "@/lib/router";
import { LoginForm } from "@/components/auth/LoginForm";
import { getUserData } from "@/lib/utils/getUserData";
import { getRoleRedirectPath } from "@/lib/utils/getRoleRedirectPath";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    getUserData().then((userData) => {
      if (active && userData) {
        router.replace(getRoleRedirectPath(userData.user_role));
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-end p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95 "
          style={{
            backgroundImage: "url(/images/background/landing-page-background.png)",
          }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-gray-900/70" />
      </div>

      <div className="relative z-10 p-8 w-full max-w-lg mr-20 lg:mr-40 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
        <div className="flex items-center justify-center mb-2">
          <img
            src="/images/logo/busmate-icon-old.svg"
            alt="Busmate LK"
            width={32}
            height={32}
            className="w-35 h-20 text-white"
          />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-white mb-2 drop-shadow-2xl">
            Welcome to the Smart Bus Transport Management System{" "}
          </h2>
          <p className="text-white text-sm drop-shadow-lg">
            Click the button below to access Busmate Management Portal
          </p>
        </div>

        <div className="w-full pt-0 pb-4">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
