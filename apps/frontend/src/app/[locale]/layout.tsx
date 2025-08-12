import type { Metadata } from "next";
import { Nunito } from 'next/font/google'
import "../globals.css";
import { Toaster } from "react-hot-toast";
import { NextIntlClientProvider } from 'next-intl';
import LanguageSwitcher from '../components/LanguageSwitcher';

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700'] })

export const metadata: Metadata = {
  title: "FlohMarkt+",
  description: "Digital Flea Market for Local Neighborhoods",
};

type PageProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: PageProps) {
  const { locale } = await params;
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className={`${nunito.className} antialiased`}>
        <LanguageSwitcher />
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        {children}
      </div>
    </NextIntlClientProvider>
  );
}