import { Nunito } from 'next/font/google'

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700'] })

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${nunito.className} antialiased`}>
      {children}
    </div>
  );
}