"use client";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

const locales = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  function switchLocale(newLocale: string) {
    // Replace the locale in the pathname
    const segments = pathname.split("/").filter(Boolean);
    if (locales.some(l => l.code === segments[0])) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }
    router.push("/" + segments.join("/"));
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2 items-center">
      {locales.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => switchLocale(code)}
          className={`px-3 py-1 rounded text-sm font-semibold transition border border-orange-200 hover:bg-orange-100 ${currentLocale === code ? "bg-orange-600 text-white" : "bg-white text-orange-700"}`}
          disabled={currentLocale === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
} 