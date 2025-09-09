'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const checkUserRole = async () => {
    try {
      setIsLoading(true);
      
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

      // Call the auth/me endpoint to get user info
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3950'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userData = await response.json();
      setUser(userData);
      setRole(userData.role || '');
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
  };

  // Method to set user data immediately after login (prevents unauthorized redirect)
  const setUserData = (userData: User) => {
    setUser(userData);
    setRole(userData.role || '');
    setIsLoaded(true);
    setIsLoading(false);
  };

  // Method to refresh user data
  const refreshUser = async () => {
    await checkUserRole();
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    sessionStorage.removeItem('auth_token');
    setRole('');
    setUser(null);
    setIsLoaded(false);
    
    // Extract locale from current pathname for proper redirect
    const pathSegments = pathname.split('/');
    const locale = pathSegments[1] || 'en';
    router.push(`/${locale}/login`);
  };

  // Check user role when component mounts
  useEffect(() => {
    checkUserRole();
  }, []);

  // Auto-check user role when pathname changes (for route protection)
  useEffect(() => {
    console.log('UserContext route protection - pathname:', pathname, 'role:', role, 'isLoaded:', isLoaded, 'isLoading:', isLoading);
    
    if (isLoaded && pathname && !isLoading) {
      // Extract locale from pathname
      const pathSegments = pathname.split('/');
      const locale = pathSegments[1]; // e.g., 'en', 'de'
      
      // Don't redirect if we're still loading or if user is not loaded yet
      if (isLoading || !isLoaded) {
        console.log('UserContext - still loading, skipping route protection');
        return;
      }
      
      // Don't redirect if we're on auth pages
      if (pathname.includes('/login') || pathname.includes('/signup')) {
        console.log('UserContext - on auth page, skipping route protection');
        return;
      }
      
      // Don't redirect if we're on the unauthorized page
      if (pathname.includes('/unauthorized')) {
        console.log('UserContext - on unauthorized page, skipping route protection');
        return;
      }
      
      // Protect admin routes
      if (pathname.includes('/admin') && role !== 'admin') {
        console.log('UserContext - admin route protection triggered, redirecting to unauthorized');
        router.push(`/${locale}/unauthorized`);
        return;
      }
      
      // Protect buyer routes - but our seller items page is under /user-markets, not /buyer
      if (pathname.includes('/buyer') && role !== 'buyer') {
        console.log('UserContext - buyer route protection triggered, redirecting to unauthorized');
        router.push(`/${locale}/unauthorized`);
        return;
      }
      
      // Protect seller routes - but exclude buyer pages that show seller info
      if (pathname.includes('/seller') && !pathname.includes('/user-markets') && role !== 'seller') {
        console.log('UserContext - seller route protection triggered, redirecting to unauthorized');
        router.push(`/${locale}/unauthorized`);
        return;
      }
      
      console.log('UserContext - route protection passed, no redirect needed');
    }
  }, [pathname, role, isLoaded, isLoading, router]);

  return (
    <UserContext.Provider value={{ role, isLoaded, isLoading, user, checkUserRole, setUserData, refreshUser, logout }}>
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