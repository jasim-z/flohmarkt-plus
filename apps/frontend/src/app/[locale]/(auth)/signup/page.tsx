"use client";

import { useEffect } from "react";
import Image from "next/image";
import { getCurrentUser } from "../../../api/auth";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
// Language switcher hidden on auth screens
import { SignupForm } from "@/components/forms";
import Link from "next/link";

export default function SignupPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    async function checkUser() {
      const user = await getCurrentUser();
      if (user) {
        if (user.role === "buyer") {
          router.replace(`/${params.locale}/user-markets`);
        } else if (user.role === "seller") {
          router.replace(`/${params.locale}/overview`);
        } else if (user.role === "admin") {
          router.replace(`/${params.locale}/dashboard`);
        } else {
          router.replace(`/${params.locale}/home`);
        }
      }
    }
    checkUser();
  }, [router, params.locale]);

  const handleSignupSuccess = () => {
    // Redirect to login after successful signup
    setTimeout(() => {
      router.push(`/${params.locale}/login`);
    }, 2000);
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
      {/* Right: Signup form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create your account</h1>
            <p className="mt-2 text-gray-500">Join the community marketplace</p>
          </div>
          <div className="p-6 rounded-2xl shadow-lg border border-gray-200 bg-white/95 backdrop-blur">
            <SignupForm onSuccess={handleSignupSuccess} />
            <p className="mt-6 text-center text-gray-500 text-sm">
              {t("signup.hasAccount")} <Link href={`/${params.locale}/login`} className="text-blue-600 hover:underline">{t("signup.loginLink")}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}