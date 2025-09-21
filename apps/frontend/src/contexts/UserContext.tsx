'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser } from '@/app/api/auth';
import { logServiceStatus } from '@/app/lib/devFallback';

interface User {
  _id: string;
  email: string;
  displayName: string;
  role: string;
  [key: string]: unknown;
}

interface UserContextType {
  role: string;
  isLoaded: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  user: User | null;
  checkUserRole: () => Promise<void>;
  setUserData: (userData: User) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const checkUserRole = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Log service status in development
      await logServiceStatus();
      
      // Get the auth token
      const token = localStorage.getItem('auth_token') || 
                    localStorage.getItem('token') || 
                    sessionStorage.getItem('auth_token');
      
      if (!token) {
        setRole('');
        setUser(null);
        setIsLoaded(true);
        return;
      }

      // Use the new API client with error handling
      const userData = await getCurrentUser();
      
      if (userData) {
        setUser(userData);
        setRole(userData.role || '');
      } else {
        // No user data returned, clear everything
        setRole('');
        setUser(null);
      }
      
      setIsLoaded(true);
      
    } catch (error) {
      console.error('Error checking user role:', error);
      // Clear invalid token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      sessionStorage.removeItem('auth_token');
      setRole('');
      setUser(null);
      setIsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Method to set user data immediately after login (prevents unauthorized redirect)
  const setUserData = useCallback((userData: User) => {
    setUser(userData);
    setRole(userData.role || '');
    setIsLoaded(true);
    setIsLoading(false);
  }, []);

  // Method to refresh user data
  const refreshUser = useCallback(async () => {
    await checkUserRole();
  }, [checkUserRole]);

  const logout = useCallback(() => {
    setIsLoggingOut(true);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    sessionStorage.removeItem('auth_token');
    setRole('');
    setUser(null);
    setIsLoaded(true); // Keep as loaded to prevent loading spinner
    setIsLoading(false); // Ensure not loading
    
    // Extract locale from current pathname for proper redirect
    const pathSegments = pathname.split('/');
    const locale = pathSegments[1] || 'en';
    router.push(`/${locale}/login`);
    
    // Reset logout state after redirect
    setTimeout(() => setIsLoggingOut(false), 100);
  }, [pathname, router]);

  // Check user role when component mounts
  useEffect(() => {
    checkUserRole();
  }, []);

  // Auto-check user role when pathname changes (for route protection)
  useEffect(() => {
    // Only run route protection if we're fully loaded and not in the middle of logout
    if (!isLoaded || isLoading || isLoggingOut || !pathname) {
      return;
    }

    // Extract locale from pathname
    const pathSegments = pathname.split('/');
    const locale = pathSegments[1]; // e.g., 'en', 'de'
    
    // Don't redirect if we're on auth pages
    if (pathname.includes('/login') || pathname.includes('/signup')) {
      return;
    }
    
    // Don't redirect if we're on the unauthorized page
    if (pathname.includes('/unauthorized')) {
      return;
    }
    
    // Protect admin routes
    if (pathname.includes('/admin') && role !== 'admin') {
      router.push(`/${locale}/unauthorized`);
      return;
    }
    
    // Protect buyer routes - but our seller items page is under /user-markets, not /buyer
    if (pathname.includes('/buyer') && role !== 'buyer') {
      router.push(`/${locale}/unauthorized`);
      return;
    }
    
    // Protect seller routes - but exclude buyer pages that show seller info
    if (pathname.includes('/seller') && !pathname.includes('/user-markets') && role !== 'seller') {
      router.push(`/${locale}/unauthorized`);
      return;
    }
  }, [pathname, role, isLoaded, isLoading, isLoggingOut, router]);

  return (
    <UserContext.Provider value={{ role, isLoaded, isLoading, isLoggingOut, user, checkUserRole, setUserData, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}