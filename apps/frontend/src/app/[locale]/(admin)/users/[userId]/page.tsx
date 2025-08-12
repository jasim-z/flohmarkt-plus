'use client';

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaUser, FaEnvelope, FaCalendar, FaUserShield, FaTimesCircle, FaArrowLeft, FaStore, FaUsers, FaMapMarkerAlt, FaClock, FaInfo, FaPhone } from "react-icons/fa";
import { User } from "../../../../api/users";
import { Market, getMarketsByUser } from "../../../../api/markets";
import { getUserById } from "../../../../api/users";

export default function UserDetail() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch real user data
        const userData = await getUserById(params.userId as string);
        setUser(userData);
        
        // Fetch real markets data
        setMarketsLoading(true);
        const userMarkets = await getMarketsByUser(params.userId as string);
        setMarkets(userMarkets);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      } finally {
        setLoading(false);
        setMarketsLoading(false);
      }
    };

    if (params.userId) {
      fetchUserData();
    }
  }, [params.userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
          >
            <FaArrowLeft className="h-4 w-4" />
            <span>Back to Users</span>
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <FaTimesCircle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {error?.includes('not found') ? 'User Not Found' : 'Error Loading User'}
                </h3>
                <p className="text-gray-600">
                  {error || 'The requested user could not be found or loaded.'}
                </p>
                {error?.includes('not found') && (
                  <p className="text-sm text-gray-500 mt-2">
                    The user ID &quot;{params.userId}&quot; doesn&apos;t exist in the system.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Market['status']) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'past':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Market['status']) => {
    switch (status) {
      case 'ongoing':
        return 'Ongoing';
      case 'upcoming':
        return 'Upcoming';
      case 'past':
        return 'Past';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
        >
          <FaArrowLeft className="h-4 w-4" />
          <span>Back to Users</span>
        </button>

        {/* User Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <FaUser className="h-12 w-12 text-white" />
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{user.displayName}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FaEnvelope className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaUserShield className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700 capitalize">{user.role}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FaCalendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      Joined {formatDate(user.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaPhone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {user.phoneNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Markets */}
        {user.role === 'seller' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Joined Markets</h2>
            <div className="flex items-center space-x-2 text-gray-600">
              <FaUsers className="h-5 w-5" />
              <span>{markets.length} markets</span>
            </div>
          </div>

          {marketsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : markets.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaStore className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Markets Joined Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                This user hasn&apos;t joined any markets yet. They can browse available markets and register as vendors to start participating.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <FaInfo className="h-4 w-4 text-blue-500" />
                  <span>Users can join markets by registering as vendors in the Markets section</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market) => (
                <div
                  key={market._id}
                  className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-blue-300 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{market.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getStatusColor(market.status)}`}>
                      {getStatusLabel(market.status)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{market.description}</p>
                  
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <FaMapMarkerAlt className="h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-1">{market.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaCalendar className="h-3 w-3 flex-shrink-0" />
                      <span>{formatDate(market.date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaClock className="h-3 w-3 flex-shrink-0" />
                      <span>{formatTime(market.startTime)} - {formatTime(market.endTime)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaUsers className="h-3 w-3 flex-shrink-0" />
                      <span>{market.registeredVendors.length} vendors</span>
                    </div>
                    {market.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {market.categories.slice(0, 3).map((category, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {category}
                          </span>
                        ))}
                        {market.categories.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            +{market.categories.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
} 