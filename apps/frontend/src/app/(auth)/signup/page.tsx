"use client";

import { useState } from "react";
import Link from "next/link";
import FleaMarketIllustration from "../../components/FleaMarketIllustration";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signupUser } from "../../api/auth";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (password !== confirmPassword) {
      toast.error("Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);
    try {
      await signupUser({ email, password, displayName });
      toast.success("Registrierung erfolgreich! Du kannst dich jetzt einloggen.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setDisplayName("");
      setTimeout(() => {
        router.push("/login");
      }, 2700);
    } catch (err: any) {
      toast.error(err.message || "Registrierung fehlgeschlagen");
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
            <h2 className="text-2xl font-bold text-orange-800 mb-2">Willkommen zum Münchner Flohmarkt!</h2>
            <p className="text-orange-700 text-lg">Entdecke, kaufe und verkaufe Schätze aus deiner Nachbarschaft.<br />
              <span className="inline-block mt-2">Handeln, stöbern, Gemeinschaft erleben.</span>
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
          <h1 className="text-3xl font-bold text-center text-orange-700 mb-6">Registrieren</h1>
          <form onSubmit={handleSignup} className="space-y-4">
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              type="text"
              placeholder="Name oder Nickname"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
            />
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              type="password"
              placeholder="Passwort bestätigen"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
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
              Registrieren
            </button>
          </form>
          <p className="mt-6 text-center text-gray-500">
            Schon ein Konto?{" "}
            <Link href="/login" className="text-orange-600 hover:underline">
              Login
            </Link>
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