'use client';

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaUser, FaEnvelope, FaCalendar, FaUserShield, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaStore, FaUsers, FaMapMarkerAlt } from "react-icons/fa";
import { User } from "../../../../api/users";

// Mock markets data - replace with actual API call when markets service is ready
interface Market {
  _id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
  participantCount: number;
  image?: string;
}

const mockMarkets: Market[] = [
  {
    _id: '1',
    name: 'Spring Flea Market',
    description: 'A vibrant spring market with local vendors and artisans',
    location: 'Central Park, Downtown',
    startDate: '2024-03-15',
    endDate: '2024-03-17',
    status: 'upcoming',
    participantCount: 45
  },
  {
    _id: '2',
    name: 'Vintage Collectors Fair',
    description: 'Specialized market for vintage and antique items',
    location: 'Historic District',
    startDate: '2024-02-20',
    endDate: '2024-02-22',
    status: 'completed',
    participantCount: 32
  },
  {
    _id: '3',
    name: 'Artisan Craft Market',
    description: 'Handmade crafts and unique artistic creations',
    location: 'Arts Quarter',
    startDate: '2024-01-10',
    endDate: '2024-01-12',
    status: 'completed',
    participantCount: 28
  }
];

export default function UserDetail() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);

  useEffect(() => {
    // Mock user data - replace with actual API call
    const mockUser: User = {
      _id: params.userId as string,
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      role: 'seller',
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    };
    
    setUser(mockUser);
    setMarkets(mockMarkets);
    setLoading(false);
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <FaTimesCircle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">User not found</h3>
                <p className="text-gray-600">{error || 'The requested user could not be found.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Market['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Market['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
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
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaStore className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {markets.length} markets joined
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Markets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Joined Markets</h2>
            <div className="flex items-center space-x-2 text-gray-600">
              <FaUsers className="h-5 w-5" />
              <span>{markets.length} markets</span>
            </div>
          </div>

          {markets.length === 0 ? (
            <div className="text-center py-12">
              <FaStore className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No markets joined yet</h3>
              <p className="text-gray-600">This user hasn't joined any markets yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market) => (
                <div
                  key={market._id}
                  className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-blue-300 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{market.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(market.status)}`}>
                      {getStatusLabel(market.status)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{market.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <FaMapMarkerAlt className="h-3 w-3" />
                      <span>{market.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaCalendar className="h-3 w-3" />
                      <span>
                        {new Date(market.startDate).toLocaleDateString()} - {new Date(market.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaUsers className="h-3 w-3" />
                      <span>{market.participantCount} participants</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 