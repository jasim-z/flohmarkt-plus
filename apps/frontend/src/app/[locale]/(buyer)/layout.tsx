'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import Loading from '@/app/components/loading';
import { PageErrorBoundary } from '@/app/components/ErrorBoundary';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const { role, isLoaded, isLoading } = useUser();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    console.log('BuyerLayout - role:', role, 'isLoaded:', isLoaded, 'isLoading:', isLoading);
    // Only redirect if we're sure the user is not a buyer
    // Give more time for the UserContext to load user data
    if (isLoaded && !isLoading) {
      if (role && role !== 'buyer') {
        console.log('user is not buyer, redirecting to unauthorized');
        router.push(`/${params.locale}/unauthorized`);
      }
    }
  }, [role, isLoaded, isLoading, router, params.locale]);

  // Show loading while checking authentication
  if (isLoading || !isLoaded) {
    return <Loading />;
  }

  // Give more time for the role to load before redirecting
  // This prevents premature redirects when role is still loading
  if (role && role !== 'buyer') {
    console.log('BuyerLayout - role loaded but not buyer, redirecting');
    return null; // Will redirect to unauthorized
  }

  // If we don't have a role yet but we're loaded, show loading
  // This gives the UserContext more time to fetch the role
  if (isLoaded && !role) {
    console.log('BuyerLayout - loaded but no role yet, showing loading');
    return <Loading />;
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