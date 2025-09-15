'use client';
import { FaShoppingCart, FaHeart, FaUserCircle, FaBell, FaCog, FaChevronDown } from 'react-icons/fa';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { logoutUser } from '../api/auth';
import { useUser } from '@/contexts/UserContext';
import HeaderLanguageSwitcher from './HeaderLanguageSwitcher';
import { getUnreadTotal } from '@/app/api/messages';
import { useSocket } from '@/app/hooks/useSocket';
import { ComponentErrorBoundary } from './ErrorBoundary';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  useSocket((socket) => {
    socket.on('unread:total', ({ total }: any) => {
      setUnreadTotal(typeof total === 'number' ? total : 0);
    });
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load unread total periodically
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getUnreadTotal();
        if (!cancelled) setUnreadTotal(res.total || 0);
      } catch {}
    };
    load();
    const id = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user?._id]);

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
    <ComponentErrorBoundary>
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo and App Name */}
          <div className="flex items-center space-x-4 sm:space-x-8">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">F</span>
              </div>
              <span className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight">
                FlohMarkt<span className="text-blue-600">+</span>
              </span>
            </div>
            
            {/* Desktop Navigation Menu */}
            <nav className="hidden lg:flex space-x-8">
              {user?.role === 'admin' && (
                <>
                  <Link 
                    href={`/${params.locale}/dashboard`} 
                    className={`font-medium transition-colors duration-200 ${
                      pathname.includes('/dashboard') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href={`/${params.locale}/users`} 
                    className={`font-medium transition-colors duration-200 ${
                      pathname.includes('/users') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Users
                  </Link>
                  <Link 
                    href={`/${params.locale}/markets`} 
                    className={`font-medium transition-colors duration-200 ${
                      pathname.includes('/markets') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Markets
                  </Link>
                </>
              )}
              
              {user?.role === 'seller' && (
                <>
                  <Link 
                    href={`/${params.locale}/overview`} 
                    className={`font-medium transition-colors duration-200 ${
                      pathname.includes('/overview') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Home
                  </Link>
                  <Link 
                    href={`/${params.locale}/explore-markets`} 
                    className={`font-medium transition-colors duration-200 ${
                      pathname.includes('/explore-markets') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Explore Markets
                  </Link>
                  <Link 
                    href={`/${params.locale}/my-markets`} 
                    className={`font-medium transition-colors duration-200 ${
                      pathname.includes('/my-markets') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    My Markets
                  </Link>
                  <Link 
                    href={`/${params.locale}/orders`} 
                    className={`font-medium transition-colors duration-200 ${
                      pathname.includes('/orders') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Orders
                  </Link>
                  <Link 
                    href={`/${params.locale}/messages`} 
                    className={`font-medium transition-colors duration-200 relative ${
                      pathname.includes('/messages') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Messages
                    {unreadTotal > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] px-1 rounded-full bg-blue-600 text-white align-middle">
                        {unreadTotal}
                      </span>
                    )}
                  </Link>
                </>
              )}
              
              {user?.role === 'buyer' && (
                <>
                  <Link 
                    href={`/${params.locale}/user-markets`} 
                    className={`font-medium transition-colors duration-200 ${
                      pathname.includes('/user-markets') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Markets
                  </Link>
                  <Link 
                    href={`/${params.locale}/home`} 
                    className={`font-medium transition-colors duration-200 ${
                      pathname.includes('/home') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Browse
                  </Link>
                  <Link 
                    href={`/${params.locale}/user-orders`} 
                    className={`font-medium transition-colors duration-200 ${
                      pathname.includes('/user-orders') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Orders
                  </Link>
                  <Link 
                    href={`/${params.locale}/user-messages`} 
                    className={`font-medium transition-colors duration-200 relative ${
                      pathname.includes('/user-messages') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Messages
                    {unreadTotal > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] px-1 rounded-full bg-blue-600 text-white align-middle">
                        {unreadTotal}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </nav>
          </div>



          {/* Right Side Icons and Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 rounded-lg hover:bg-gray-100"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <HeaderLanguageSwitcher />
            
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 rounded-lg hover:bg-gray-100">
              <FaBell size={18} className="sm:w-5 sm:h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Account Dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="flex items-center space-x-2 cursor-pointer px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 min-h-[44px]"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FaUserCircle size={18} className="text-white sm:w-5 sm:h-5" />
                </div>
                <span className="hidden sm:inline text-gray-700 font-medium">
                  {user?.displayName || user?.email || 'Account'}
                </span>
                <FaChevronDown size={12} className={`hidden sm:block transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} />
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
                  
                  {/* Profile */}
                  <button 
                    onClick={() => {
                      setIsAccountOpen(false);
                      const profilePath = user?.role === 'admin' 
                        ? 'admin/profile' 
                        : user?.role === 'seller' 
                        ? 'seller-profile' 
                        : 'user-profile';
                      router.push(`/${params.locale}/${profilePath}`);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <FaUserCircle size={14} />
                    <span>My Profile</span>
                  </button>
                  
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

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div ref={mobileMenuRef} className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {user?.role === 'admin' && (
                <>
                  <Link 
                    href={`/${params.locale}/dashboard`} 
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                      pathname.includes('/dashboard') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href={`/${params.locale}/users`} 
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                      pathname.includes('/users') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Users
                  </Link>
                  <Link 
                    href={`/${params.locale}/markets`} 
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                      pathname.includes('/markets') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Markets
                  </Link>
                </>
              )}
              
              {user?.role === 'seller' && (
                <>
                  <Link 
                    href={`/${params.locale}/overview`} 
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                      pathname.includes('/overview') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    href={`/${params.locale}/explore-markets`} 
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                      pathname.includes('/explore-markets') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Explore Markets
                  </Link>
                  <Link 
                    href={`/${params.locale}/my-markets`} 
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                      pathname.includes('/my-markets') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Markets
                  </Link>
                  <Link 
                    href={`/${params.locale}/orders`} 
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                      pathname.includes('/orders') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  <Link 
                    href={`/${params.locale}/messages`} 
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 relative ${
                      pathname.includes('/messages') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="flex items-center justify-between">
                      Messages
                      {unreadTotal > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] text-xs px-1 rounded-full bg-blue-600 text-white">
                          {unreadTotal}
                        </span>
                      )}
                    </span>
                  </Link>
                </>
              )}
              
              {user?.role === 'buyer' && (
                <>
                  <Link 
                    href={`/${params.locale}/user-markets`} 
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                      pathname.includes('/user-markets') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Markets
                  </Link>
                  <Link 
                    href={`/${params.locale}/home`} 
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                      pathname.includes('/home') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Browse
                  </Link>
                  <Link 
                    href={`/${params.locale}/user-orders`} 
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                      pathname.includes('/user-orders') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  <Link 
                    href={`/${params.locale}/user-messages`} 
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 relative ${
                      pathname.includes('/user-messages') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="flex items-center justify-between">
                      Messages
                      {unreadTotal > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] text-xs px-1 rounded-full bg-blue-600 text-white">
                          {unreadTotal}
                        </span>
                      )}
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
    </ComponentErrorBoundary>
  );
} 