"use client";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { FaGlobe, FaChevronDown } from "react-icons/fa";

const locales = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

export default function HeaderLanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchLocale(newLocale: string) {
    // Replace the locale in the pathname
    const segments = pathname.split("/").filter(Boolean);
    if (locales.some(l => l.code === segments[0])) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }
    router.push("/" + segments.join("/"));
    setIsOpen(false);
  }

  const currentLocaleData = locales.find(l => l.code === currentLocale);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 rounded-lg hover:bg-gray-50"
      >
        <FaGlobe size={16} />
        <span className="hidden md:inline text-sm font-medium">
          {currentLocaleData?.label}
        </span>
        <FaChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {locales.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => switchLocale(code)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                currentLocale === code
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 