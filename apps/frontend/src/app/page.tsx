'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "./api/auth";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        setIsLoading(true);
        
        // Only run on client side and add a small delay to prevent immediate API calls
        if (typeof window !== 'undefined') {
          // Add a small delay to prevent immediate API calls during container startup
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const user = await getCurrentUser();
          if (user && user.role === 'buyer') {
            router.replace('/en/user-markets');
          } else {
            router.replace('/en/login');
          }
        } else {
          // On server side, just redirect to login
          router.replace('/en/login');
        }
      } catch (error) {
        console.error('Error checking user:', error);
        // If there's an error, just redirect to login
        router.replace('/en/login');
      } finally {
        setIsLoading(false);
      }
    }
    
    checkUser();
  }, [router]);

  // Show loading state instead of null
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Redirecting...</div>
    </div>
  );
}
