'use client';

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaUser, FaEnvelope, FaCalendar, FaUserShield, FaTimesCircle, FaArrowLeft, FaStore, FaUsers, FaMapMarkerAlt, FaClock, FaInfo, FaPhone, FaShoppingCart, FaStar } from "react-icons/fa";
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
        
        const [userData, userMarkets] = await Promise.all([
          getUserById(params.userId as string),
          getMarketsByUser(params.userId as string)
        ]);
      
        setUser(userData);
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
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center sm:justify-start space-x-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors duration-200 w-full sm:w-auto"
        >
          <FaArrowLeft className="h-4 w-4" />
          <span>Back to Users</span>
        </button>

        {/* User Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <FaUser className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </div>
            
            {/* User Info */}
            <div className="flex-1 w-full text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{user.displayName}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full inline-block ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="px-3 py-1 text-sm font-medium rounded-full inline-block bg-blue-200 text-gray-800 capitalize">
                  {user.role}
                </span>
              </div>
              {user.bio && (
                <div className="flex items-start space-x-3 mb-3">
                  <FaInfo className="h-4 w-4 text-gray-500 mt-1" />
                  <span className="text-gray-900 font-medium">{user.bio}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  
                  <div className="flex items-center space-x-3">
                    <FaEnvelope className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{user.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <FaPhone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{user.phoneNumber}</span>
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
                    <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {user.city}, {user.neighborhood}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Statistics and Additional Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center sm:text-left">User Statistics & Details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Rating */}
            {user.rating && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">★</span>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600 font-medium">Rating</div>
                    <div className="text-2xl font-bold text-blue-900">{user.rating}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Total Sales */}
            {user.totalSales !== undefined && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FaStore className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-green-600 font-medium">Total Sales</div>
                    <div className="text-2xl font-bold text-green-900">{user.totalSales}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Total Purchases */}
            {user.totalPurchases !== undefined && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <FaShoppingCart className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-purple-600 font-medium">Total Purchases</div>
                    <div className="text-2xl font-bold text-purple-900">{user.totalPurchases}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Total Reviews */}
            {user.totalReviews !== undefined && (
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <FaStar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm text-orange-600 font-medium">Total Reviews</div>
                    <div className="text-2xl font-bold text-orange-900">{user.totalReviews}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Location Details */}
            {(user.city || user.neighborhood) && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 text-center lg:text-left">Location</h3>
                <div className="space-y-2">
                  {user.city && (
                    <div className="flex items-center space-x-3">
                      <FaMapMarkerAlt className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">City: {user.city}</span>
                    </div>
                  )}
                  {user.neighborhood && (
                    <div className="flex items-center space-x-3">
                      <FaMapMarkerAlt className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">Neighborhood: {user.neighborhood}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verification & Badges */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 text-center lg:text-left">Verification & Badges</h3>
              <div className="space-y-2">
                {user.isVerified !== undefined && (
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${user.isVerified ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-gray-700">
                      {user.isVerified ? 'Verified User' : 'Not Verified'}
                    </span>
                  </div>
                )}
                {user.badges && user.badges.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <FaStar className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <div className="flex flex-wrap gap-2">
                      {user.badges.map((badge, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User's Markets */}
        {user.role === 'seller' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center sm:text-left">Joined Markets</h2>
            <div className="flex items-center justify-center sm:justify-start space-x-2 text-gray-600">
              <FaUsers className="h-5 w-5" />
              <span>{markets.length} markets</span>
            </div>
          </div>

          {marketsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200 animate-pulse">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {markets.map((market) => (
                <div
                  key={market._id}
                  className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200 hover:border-blue-300 transition-colors duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0 mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-1">{market.name}</h3>
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