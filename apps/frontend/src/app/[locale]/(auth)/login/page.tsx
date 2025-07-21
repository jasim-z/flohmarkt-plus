"use client";

import { useState } from "react";
import FleaMarketIllustration from "../../../components/FleaMarketIllustration";
import { loginUser } from "../../../api/auth";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "../../../components/LanguageSwitcher";

export default function LoginPage() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setMessage("");
    setLoading(true);
    try {
      await loginUser(email, password);
      setMessage(t("login.success"));
      // Optionally redirect or fetch user data here
    } catch (err: unknown) {
      setMessage((err instanceof Error ? err.message : String(err)) || t("login.error"));
    }
    setLoading(false);
  }

  return (
    <>
      {/* Desktop: SVG + write-ups on left, bg-yellow-50 */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-yellow-50 p-10">
        <div className="w-full flex flex-col items-center">
          <div className="w-3/4 max-w-xs md:max-w-md md:w-full">
            <FleaMarketIllustration />
          </div>
          <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold text-orange-800 mb-2">{t("welcome.headline")}</h2>
            <p className="text-orange-700 text-lg">{t("welcome.sub")}<br />
            </p>
          </div>
        </div>
      </div>
      {/* Mobile: SVG only above form */}
      <div className="flex md:hidden flex-col items-center w-full pt-8 bg-yellow-50">
        <div className="w-3/4 max-w-xs mb-6">
          <FleaMarketIllustration />
        </div>
      </div>
      {/* Form: always visible, right on desktop, below SVG on mobile, bg-orange-50 */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-4 md:p-8 bg-orange-50">
        <div className="w-full max-w-sm md:max-w-md p-6 md:p-8 rounded-2xl shadow-lg border border-orange-100 bg-white">
          <LanguageSwitcher />
          <h1 className="text-3xl font-bold text-center text-orange-700 mb-6">{t("login.title")}</h1>
          <form onSubmit={handleLogin} className="space-y-5">
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              type="email"
              placeholder={t("login.email")}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              type="password"
              placeholder={t("login.password")}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              className="w-full bg-orange-600 text-white p-3 rounded-lg font-semibold hover:bg-orange-700 transition flex items-center justify-center disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="loader border-2 border-white border-t-transparent rounded-full w-5 h-5 inline-block align-middle mr-2 animate-spin"></span>
              ) : null}
              {t("login.button")}
            </button>
          </form>
          {message && <p className="mt-4 text-center text-red-500">{message}</p>}
          <p className="mt-6 text-center text-gray-500">
            {t("login.noAccount")} <a href={`/${typeof window !== 'undefined' && window.location.pathname.split('/')[1] || 'en'}/signup`} className="text-orange-600 hover:underline">{t("login.signupLink")}</a>
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