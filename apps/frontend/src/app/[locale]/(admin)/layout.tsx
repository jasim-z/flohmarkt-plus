'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import Loading from '@/app/components/loading';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, isLoaded, isLoading } = useUser();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (isLoaded && !isLoading && role !== 'admin') {
      router.push(`/${params.locale}/unauthorized`);
    }
  }, [role, isLoaded, isLoading, router, params.locale]);

  // Show loading while checking authentication
  if (isLoading || !isLoaded) {
    return <Loading />;
  }

  // Show unauthorized if not admin
  if (role !== 'admin') {
    return null; // Will redirect to unauthorized
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50">{children}</main>
      <Footer />
    </div>
  );
} 