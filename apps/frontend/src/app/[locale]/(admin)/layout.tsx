'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Header, Footer, LoadingSpinner as Loading, ErrorBoundary as PageErrorBoundary } from '@/components';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, isLoaded, isLoading, isLoggingOut } = useUser();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (isLoaded && !isLoading && !isLoggingOut && role && role !== 'admin') {
      router.push(`/${params.locale}/unauthorized`);
    }
  }, [role, isLoaded, isLoading, isLoggingOut, router, params.locale]);

  // Show loading while checking authentication
  if ((isLoading || !isLoaded) && !isLoggingOut) {
    return <Loading />;
  }

  // If role not yet known but loaded (and not logging out), keep loading to avoid false unauthorized
  if (isLoaded && !isLoggingOut && !role) {
    return <Loading />;
  }

  // Show unauthorized only when role is known and not admin
  if (role && role !== 'admin') {
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