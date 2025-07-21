import type { Metadata } from "next";
import { Nunito } from 'next/font/google'
import "./globals.css";
import { Toaster } from "react-hot-toast";
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700'] })

export const metadata: Metadata = {
  title: "FlohMarkt+",
  description: "Digital Flea Market for Local Neighborhoods",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.className} antialiased`}
      >
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        {children}
      </body>
    </html>
  );
}
