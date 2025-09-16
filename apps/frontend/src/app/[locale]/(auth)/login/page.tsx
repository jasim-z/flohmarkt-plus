"use client";

import { getCurrentUser } from "@/app/api/auth";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import Image from "next/image";
import { LoginForm } from "../../../components/forms/LoginForm";
import Link from "next/link";

export default function Login() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const { setUserData } = useUser();

  useEffect(() => {
    async function checkUser() {
      const user = await getCurrentUser();
      if (user && user.role === "buyer") {
        router.replace(`/${params.locale}/user-markets`);
      } else if (user && user.role === "seller") {
        router.replace(`/${params.locale}/overview`);
      } else if (user && user.role === "admin") {
        router.replace(`/${params.locale}/dashboard`);
      }
    }
    checkUser();
  }, [router, params.locale]);

  const handleLoginSuccess = async () => {
    const user = await getCurrentUser();
    if (user) {
      setUserData(user);
      
      if (user.role === "buyer") {
        router.replace(`/${params.locale}/user-markets`);
      } else if (user.role === "seller") {
        router.replace(`/${params.locale}/overview`);
      } else if (user.role === "admin") {
        router.replace(`/${params.locale}/dashboard`);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      {/* Visual panel with market image */}
      <div className="hidden md:block w-1/2 relative">
        <Image
          src="/images/market_1.jpg"
          alt="Flea market"
          fill
          priority
          className="object-cover"
          sizes="(min-width: 768px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center text-white text-center">
          <div>
            <h2 className="text-4xl font-extrabold drop-shadow-lg">Welcome to FlohMarkt+</h2>
            <p className="mt-3 text-white/90 text-lg font-medium">{t("welcome.sub")}</p>
          </div>
        </div>
      </div>
      {/* Mobile image banner */}
      <div className="md:hidden relative w-full h-40">
        <Image src="/images/market_1.jpg" alt="Flea market" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/30" />
      </div>
      {/* Right: Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="mt-2 text-gray-500">Sign in to your account</p>
          </div>
          <div className="p-6 rounded-2xl shadow-lg border border-gray-200 bg-white/95 backdrop-blur">
            <LoginForm onSuccess={handleLoginSuccess} />
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-500"></span>
              <Link href="#" className="text-blue-600 hover:underline">Forgot password?</Link>
            </div>
            <p className="mt-6 text-center text-gray-500 text-sm">
              {t("login.noAccount")} <Link href={`/${params.locale}/signup`} className="text-blue-600 hover:underline">{t("login.signupLink")}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}