import type { Metadata } from "next";
import { Nunito } from 'next/font/google'
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700'] })

export const metadata: Metadata = {
  title: "FlohMarkt+",
  description: "Digital Flea Market for Local Neighborhoods",
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={`${nunito.className} antialiased`}>
        <NextIntlClientProvider>
          <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
