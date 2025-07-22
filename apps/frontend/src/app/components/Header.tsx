'use client';
import { FaShoppingCart, FaHeart, FaUserCircle } from 'react-icons/fa';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { logoutUser } from '../api/auth';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await logoutUser();
    setLoading(false);
    const locale = pathname.split('/')[1] || 'en';
    router.replace(`/${locale}/login`);
  }

  return (
    <header className="bg-gradient-to-r from-orange-100 via-yellow-50 to-orange-200 shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and App Name */}
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-extrabold text-orange-600 tracking-tight select-none font-nunito drop-shadow-sm">
            FlohMarkt<span className="text-orange-400">+</span>
          </span>
          <nav className="hidden md:flex space-x-6 ml-8">
            <a href="#" className="text-gray-700 hover:text-orange-600 font-medium transition">Home</a>
            <a href="#" className="text-gray-700 hover:text-orange-600 font-medium transition">Categories</a>
            <a href="#" className="text-gray-700 hover:text-orange-600 font-medium transition">Orders</a>
          </nav>
        </div>
        {/* Icons and Logout */}
        <div className="flex items-center space-x-4">
          <a href="#" className="relative text-gray-600 hover:text-orange-500 transition">
            <FaHeart size={22} />
          </a>
          <a href="#" className="relative text-gray-600 hover:text-orange-500 transition">
            <FaShoppingCart size={22} />
            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full px-1 font-bold shadow">2</span>
          </a>
          <div className="flex items-center space-x-2 cursor-pointer px-2 py-1 rounded hover:bg-orange-100 transition">
            <FaUserCircle size={24} className="text-gray-600" />
            <span className="hidden md:inline text-gray-700 font-medium">Account</span>
          </div>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="ml-4 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold shadow hover:bg-orange-600 transition disabled:opacity-60"
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </header>
  );
} 