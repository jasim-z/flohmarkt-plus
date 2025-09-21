import type { Metadata } from "next";
import { Nunito } from 'next/font/google'
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { UserProvider } from "@/contexts/UserContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { ErrorBoundary as GlobalErrorBoundary } from "@/components";

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
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body className={`${nunito.className} antialiased`}>
        <GlobalErrorBoundary>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <UserProvider>
              <LoadingProvider>
                <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
                {children}
              </LoadingProvider>
            </UserProvider>
          </NextIntlClientProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
