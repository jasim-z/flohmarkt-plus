"use client";

import { useEffect } from "react";
import FleaMarketIllustration from "../../../components/FleaMarketIllustration";
import { getCurrentUser } from "../../../api/auth";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import { SignupForm } from "../../../components/forms/SignupForm";
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
    <>
      {/* Desktop: SVG + write-ups on left, bg-blue-50 */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 p-10">
        <div className="w-full flex flex-col items-center">
          <div className="w-3/4 max-w-xs md:max-w-md md:w-full">
            <FleaMarketIllustration />
          </div>
          <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold text-blue-800 mb-2">{t("welcome.headline")}</h2>
            <p className="text-blue-700 text-lg">{t("welcome.sub")}<br />
            </p>
          </div>
        </div>
      </div>
      {/* Mobile: SVG only above form */}
      <div className="flex md:hidden flex-col items-center w-full pt-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-3/4 max-w-xs mb-6">
          <FleaMarketIllustration />
        </div>
      </div>
      {/* Form: always visible, right on desktop, below SVG on mobile, bg-white */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-4 md:p-8 bg-white">
        <div className="w-full max-w-sm md:max-w-md p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 bg-white">
          <LanguageSwitcher />
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">{t("signup.title")}</h1>
          <SignupForm onSuccess={handleSignupSuccess} />
          <p className="mt-6 text-center text-gray-500">
            {t("signup.hasAccount")} <Link href={`/${params.locale}/login`} className="text-blue-600 hover:underline">{t("signup.loginLink")}</Link>
          </p>
        </div>
      </div>
      <style jsx>{`
        .loader {
          border-top-color: transparent;
          border-right-color: #fff;
          border-bottom-color: #fff;
          border-left-color: #fff;
        }
      `}</style>
    </>
  );
}