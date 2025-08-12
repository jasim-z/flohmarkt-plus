'use client';
import { FaShoppingCart, FaHeart, FaUserCircle, FaSearch, FaBell, FaCog, FaChevronDown } from 'react-icons/fa';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { logoutUser, getCurrentUser } from '../api/auth';
import HeaderLanguageSwitcher from './HeaderLanguageSwitcher';

interface User {
  displayName?: string;
  email?: string;
  role?: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchUser() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    }
    fetchUser();
  }, []);

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
    await logoutUser();
    setLoading(false);
    const locale = pathname.split('/')[1] || 'en';
    router.replace(`/${locale}/login`);
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
              <Link href="/en/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                Dashboard
              </Link>
              <Link href="/en/users" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                Users
              </Link>
              <a href="#" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                Markets
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                Roles
              </a>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
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