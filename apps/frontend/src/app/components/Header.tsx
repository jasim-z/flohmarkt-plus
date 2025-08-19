'use client';
import { FaShoppingCart, FaHeart, FaUserCircle, FaBell, FaCog, FaChevronDown } from 'react-icons/fa';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { logoutUser } from '../api/auth';
import { useUser } from '@/contexts/UserContext';
import HeaderLanguageSwitcher from './HeaderLanguageSwitcher';

interface User {
  displayName?: string;
  email?: string;
  role?: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { user, logout, isLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    setLoading(true);
    try {
      await logoutUser();
      logout(); // Use the context logout method
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if API call fails
      logout();
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and App Name */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">
                FlohMarkt<span className="text-blue-600">+</span>
              </span>
            </div>
            
            {/* Navigation Menu */}
            <nav className="hidden lg:flex space-x-8">
              {user?.role === 'admin' && (
                <>
                  <Link href={`/${params.locale}/dashboard`} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                    Dashboard
                  </Link>
                  <Link href={`/${params.locale}/users`} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                    Users
                  </Link>
                  <Link href={`/${params.locale}/markets`} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                    Markets
                  </Link>
                </>
              )}
              
              {user?.role === 'seller' && (
                <>
                  <Link href={`/${params.locale}/overview`} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                    Home
                  </Link>
                  <Link href={`/${params.locale}/explore-markets`} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                    Explore Markets
                  </Link>
                  <Link href={`/${params.locale}/orders`} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                    Orders
                  </Link>
                  <Link href={`/${params.locale}/messages`} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                    Messages
                  </Link>
                </>
              )}
              
              {user?.role === 'buyer' && (
                <>
                  <Link href={`/${params.locale}/home`} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                    Browse
                  </Link>
                  <Link href={`/${params.locale}/user-markets`} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                    Markets
                  </Link>
                  <Link href={`/${params.locale}/user-orders`} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                    Orders
                  </Link>
                  <Link href={`/${params.locale}/user-messages`} className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                    Messages
                  </Link>
                </>
              )}
            </nav>
          </div>



          {/* Right Side Icons and Actions */}
          <div className="flex items-center space-x-4">
            <HeaderLanguageSwitcher />
            
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200">
              <FaBell size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Account Dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FaUserCircle size={20} className="text-white" />
                </div>
                <span className="hidden md:inline text-gray-700 font-medium">
                  {user?.displayName || user?.email || 'Account'}
                </span>
                <FaChevronDown size={12} className={`transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isAccountOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || 'user@example.com'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role || 'User'}
                    </p>
                  </div>
                  
                  {/* Settings */}
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2">
                    <FaCog size={14} />
                    <span>Settings</span>
                  </button>
                  
                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-60"
                  >
                    <span>{loading ? 'Logging out...' : 'Logout'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 