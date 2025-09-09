"use client";

import { useState } from "react";
import FleaMarketIllustration from "../../../components/FleaMarketIllustration";
import { signupUser } from "../../../api/auth";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { getCurrentUser } from "../../../api/auth";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function SignupPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (password !== confirmPassword) {
      toast.error(t("signup.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      await signupUser({ email, password, displayName });
      toast.success(t("signup.success"));
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setDisplayName("");
      setTimeout(() => {
        router.push("/login");
      }, 2700);
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || t("signup.error"));
    }
    setLoading(false);
  }

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
          <form onSubmit={handleSignup} className="space-y-4">
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              type="text"
              placeholder={t("signup.name")}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
            />
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              type="email"
              placeholder={t("signup.email")}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              type="password"
              placeholder={t("signup.password")}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              type="password"
              placeholder={t("signup.confirmPassword")}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <button
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="loader border-2 border-white border-t-transparent rounded-full w-5 h-5 inline-block align-middle mr-2 animate-spin"></span>
              ) : null}
              {t("signup.button")}
            </button>
          </form>
          <p className="mt-6 text-center text-gray-500">
            {t("signup.hasAccount")} <Link href={`/${typeof window !== 'undefined' && window.location.pathname.split('/')[1] || 'en'}/login`} className="text-blue-600 hover:underline">{t("signup.loginLink")}</Link>
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