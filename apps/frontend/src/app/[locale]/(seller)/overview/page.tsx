"use client";

import { FaStore, FaUsers, FaCheckCircle, FaChartLine, FaCalendar } from "react-icons/fa";
import Link from "next/link";
import UnAuthourized from "@/components/UnAuthourized";
import { useUser } from "@/contexts/UserContext";
import { useEffect, useState } from "react";
import { getMarkets, Market } from "@/app/api/markets";
import { useParams } from "next/navigation";

export default function SellerOverview() {
  const { role, isLoaded, user } = useUser();
  const params = useParams();

  const [activeMarkets, setActiveMarkets] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [rating, setRating] = useState<number>(0);
  const [verified, setVerified] = useState<boolean>(false);
  const [upcomingMarkets, setUpcomingMarkets] = useState<Market[]>([]);

  useEffect(() => {
    if (!isLoaded || !user?._id) return;

    // Active markets count from backend pagination total
    (async () => {
      try {
        const res = await getMarkets({ page: 1, limit: 1, userId: user._id });
        setActiveMarkets(res.pagination.total || 0);
      } catch {
        setActiveMarkets(0);
      }
    })();

    // Upcoming joined markets (next 3)
    (async () => {
      try {
        const res = await getMarkets({ page: 1, limit: 3, userId: user._id, status: 'upcoming', sortBy: 'date', sortOrder: 'asc' });
        setUpcomingMarkets(res.data || []);
      } catch {
        setUpcomingMarkets([]);
      }
    })();

    // Orders count for seller as total sales
    (async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const url = `${process.env.NEXT_PUBLIC_ORDERS_API_URL || 'http://localhost:3949'}/orders`;
        const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!resp.ok) throw new Error('orders failed');
        const orders = await resp.json();
        // Count non-cancelled orders as sales
        const salesCount = Array.isArray(orders) ? orders.filter((o: { status?: string }) => o?.status !== 'cancelled').length : 0;
        setTotalSales(salesCount);
      } catch {
        setTotalSales(0);
      }
    })();

    // Rating & Verified from user profile
    setRating(Number(user?.rating || 0));
    setVerified(Boolean(user?.isVerified));
  }, [isLoaded, user?._id, user]);

  if (role !== 'seller' && isLoaded) return <UnAuthourized />;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="loader border-4 border-blue-600 border-t-transparent rounded-full w-12 h-12 mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600">Loading seller overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Overview
          </h1>
          <p className="text-gray-600">Welcome to your seller overview</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FaStore size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{activeMarkets}</h3>
                <p className="text-gray-600 text-sm">Active Markets</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                <FaUsers size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{totalSales}</h3>
                <p className="text-gray-600 text-sm">Total Sales</p>
              </div>
            </div>
          </div>

          {/* Verified status card (replaces Upcoming Markets) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${verified ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                <FaCheckCircle size={24} className="text-white" />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${verified ? 'text-gray-900' : 'text-gray-800'}`}>{verified ? 'Verified' : 'Not Verified'}</h3>
                <p className="text-gray-600 text-sm">Account Status</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <FaChartLine size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{rating.toFixed(1)}</h3>
                <p className="text-gray-600 text-sm">Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href={`/${params.locale}/explore-markets`} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                <FaStore size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Explore Markets</h3>
                <p className="text-gray-600 text-sm">Find and join flea markets</p>
              </div>
            </div>
          </Link>

          <Link href={`/${params.locale}/orders`} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FaUsers size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
                <p className="text-gray-600 text-sm">Manage your orders</p>
              </div>
            </div>
          </Link>

          <Link href={`/${params.locale}/messages`} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <FaCalendar size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                <p className="text-gray-600 text-sm">View your messages</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Upcoming Markets (Joined) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Markets</h3>
            <Link href={`/${params.locale}/my-markets`} className="text-blue-600 text-sm hover:underline">View all</Link>
          </div>
          {upcomingMarkets.length === 0 ? (
            <div className="text-sm text-gray-500">No upcoming markets.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingMarkets.map((m) => (
                <Link key={m._id} href={`/${params.locale}/explore-markets/${m._id}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="font-medium text-gray-900 mb-1 line-clamp-1">{m.name}</div>
                  <div className="text-xs text-gray-500 mb-2 line-clamp-2">{m.location}</div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="inline-flex items-center gap-1"><FaCalendar className="text-gray-400" /> {new Date(m.date).toLocaleDateString()}</span>
                    <span className="inline-flex items-center gap-1"><FaChartLine className="text-gray-400" /> {m.startTime} - {m.endTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 