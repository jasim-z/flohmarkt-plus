'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Header, Footer } from '@/components/layout';
import { EmailVerificationBanner } from '@/components/layout/EmailVerificationBanner';
import { LoadingSpinner as Loading } from '@/components/loading';
import { PageErrorBoundary } from '@/components/ErrorBoundary';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, role, isLoaded, isLoading, isLoggingOut } = useUser();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (isLoaded && !isLoading && !isLoggingOut && role && role !== 'seller') {
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

  // Show unauthorized only when role is known and not seller
  if (role && role !== 'seller') {
    return null; // Will redirect to unauthorized
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {user && !user.isVerified && (
        <EmailVerificationBanner userEmail={user.email} />
      )}
      <main className="flex-1 bg-gray-50">
        <PageErrorBoundary>
          {children}
        </PageErrorBoundary>
      </main>
      <Footer />
    </div>
  );
} 