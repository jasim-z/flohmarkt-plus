'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface UserContextType {
  role: string;
  isLoaded: boolean;
  isLoading: boolean;
  user: any | null;
  checkUserRole: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
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

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    sessionStorage.removeItem('auth_token');
    setRole('');
    setUser(null);
    setIsLoaded(false);
    router.push('/login');
  };

  // Check user role when component mounts
  useEffect(() => {
    checkUserRole();
  }, []);

  // Auto-check user role when pathname changes (for route protection)
  useEffect(() => {
    if (isLoaded && pathname) {
      // Extract locale from pathname
      const pathSegments = pathname.split('/');
      const locale = pathSegments[1]; // e.g., 'en', 'de'
      
      // Protect admin routes
      if (pathname.includes('/admin') && role !== 'admin') {
        router.push(`/${locale}/unauthorized`);
        return;
      }
      
      // Protect buyer routes
      if (pathname.includes('/buyer') && role !== 'buyer') {
        router.push(`/${locale}/unauthorized`);
        return;
      }
      
      // Protect seller routes
      if (pathname.includes('/seller') && role !== 'seller') {
        router.push(`/${locale}/unauthorized`);
        return;
      }
    }
  }, [pathname, role, isLoaded, router]);

  return (
    <UserContext.Provider value={{ role, isLoaded, isLoading, user, checkUserRole, logout }}>
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