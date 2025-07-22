import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50">{children}</main>
      <Footer />
    </div>
  );
} 