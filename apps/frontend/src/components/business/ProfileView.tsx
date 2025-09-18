'use client';

import { useState, useEffect } from 'react';
import { getUserById, User } from '@/app/api/users';
import { useUser } from '@/contexts/UserContext';

interface ProfileViewProps {
  userId: string;
  isOwnProfile?: boolean;
  viewerRole?: 'buyer' | 'seller' | 'admin';
}

export function ProfileView({ userId, isOwnProfile = false, viewerRole }: ProfileViewProps) {
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await getUserById(userId);
        if (mounted) setProfile(userData);
      } catch (err) {
        if (mounted) setError('Failed to load profile');
        console.error('Error loading profile:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    
    return () => { mounted = false; };
  }, [userId]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'seller':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'buyer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'seller':
        return 'Seller';
      case 'buyer':
        return 'Buyer';
      case 'admin':
        return 'Administrator';
      default:
        return role;
    }
  };

  const shouldShowField = (field: string) => {
    if (isOwnProfile) return true;
    if (viewerRole === 'admin') return true;
    
    // Public fields that everyone can see
    const publicFields = ['displayName', 'avatar', 'role', 'city', 'neighborhood', 'isVerified', 'totalReviews'];
    return publicFields.includes(field);
  };

  // Only show email for own profile, never for other users
  const shouldShowEmail = () => {
    return isOwnProfile;
  };

  const shouldShowRating = () => {
    // Only show rating for sellers, and only if they have a rating
    return profile?.role === 'seller' && profile?.rating && profile.rating > 0;
  };

  const shouldShowSales = () => {
    // Only show sales for sellers, and only if they have sales
    return profile?.role === 'seller' && profile?.totalSales && profile.totalSales > 0;
  };

  const shouldShowPurchases = () => {
    // Only show purchases for buyers, and only if they have purchases
    return profile?.role === 'buyer' && profile?.totalPurchases && profile.totalPurchases > 0;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
        <p className="text-gray-500">{error || 'This profile could not be loaded.'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-8">
        <div className="flex items-center space-x-6">
          <div className="relative">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.displayName}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {profile.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{profile.displayName}</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getRoleColor(profile.role)}`}>
                {getRoleLabel(profile.role)}
              </span>
            </div>
            {shouldShowField('city') && (profile.city || profile.neighborhood) && (
              <div className="flex items-center text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{[profile.neighborhood, profile.city].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            {shouldShowField('displayName') && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Display Name</span>
                <span className="font-medium text-gray-900">{profile.displayName}</span>
              </div>
            )}

            {shouldShowEmail() && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Email</span>
                <span className="font-medium text-gray-900">{profile.email}</span>
              </div>
            )}

            {shouldShowField('role') && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Role</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(profile.role)}`}>
                  {getRoleLabel(profile.role)}
                </span>
              </div>
            )}

            {shouldShowField('phoneNumber') && profile.phoneNumber && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Phone</span>
                <span className="font-medium text-gray-900">{profile.phoneNumber}</span>
              </div>
            )}

            {shouldShowField('isVerified') && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Verification</span>
                <span className={`flex items-center ${profile.isVerified ? 'text-green-600' : 'text-gray-500'}`}>
                  {profile.isVerified ? (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </>
                  ) : (
                    'Not Verified'
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Location & Activity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location & Activity</h3>
            
            {shouldShowField('city') && profile.city && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">City</span>
                <span className="font-medium text-gray-900">{profile.city}</span>
              </div>
            )}

            {shouldShowField('neighborhood') && profile.neighborhood && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Neighborhood</span>
                <span className="font-medium text-gray-900">{profile.neighborhood}</span>
              </div>
            )}

            {shouldShowRating() && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Rating</span>
                <div className="flex items-center">
                  <div className="flex items-center mr-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(profile.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="font-medium text-gray-900">
                    {(profile.rating || 0).toFixed(1)} ({profile.totalReviews || 0} reviews)
                  </span>
                </div>
              </div>
            )}

            {shouldShowSales() && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Sales</span>
                <span className="font-medium text-gray-900">{profile.totalSales}</span>
              </div>
            )}

            {shouldShowPurchases() && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Purchases</span>
                <span className="font-medium text-gray-900">{profile.totalPurchases}</span>
              </div>
            )}

            {shouldShowField('createdAt') && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {shouldShowField('bio') && profile.bio && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
            <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Badges Section */}
        {shouldShowField('badges') && profile.badges && profile.badges.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Badges</h3>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((badge, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Admin-only fields */}
        {isOwnProfile && currentUser?.role === 'admin' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  profile.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium text-gray-900">
                  {new Date(profile.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}