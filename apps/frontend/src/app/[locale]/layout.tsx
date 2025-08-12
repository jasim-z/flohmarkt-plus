import type { Metadata } from "next";
import { Nunito } from 'next/font/google'
import "../globals.css";
import { Toaster } from "react-hot-toast";
import { NextIntlClientProvider } from 'next-intl';

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700'] })

export const metadata: Metadata = {
  title: "FlohMarkt+",
  description: "Digital Flea Market for Local Neighborhoods",
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className={`${nunito.className} antialiased`}>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        {children}
      </div>
    </NextIntlClientProvider>
  );
} 