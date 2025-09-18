'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Header, Footer } from '@/components/layout';
import { LoadingSpinner as Loading } from '@/components/loading';
import { PageErrorBoundary } from '@/components/ErrorBoundary';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { role, isLoaded, isLoading, isLoggingOut } = useUser();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (isLoaded && !isLoading && role !== 'seller') {
      router.push(`/${params.locale}/unauthorized`);
    }
  }, [role, isLoaded, isLoading, router, params.locale]);

  // Show loading while checking authentication
  if ((isLoading || !isLoaded) && !isLoggingOut) {
    return <Loading />;
  }

  // Show unauthorized if not seller
  if (role !== 'seller') {
    return null; // Will redirect to unauthorized
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50">
        <PageErrorBoundary>
          {children}
        </PageErrorBoundary>
      </main>
      <Footer />
    </div>
  );
} 