'use client';

import { useEffect, useState } from 'react';
import { getUserById, User } from '@/app/api/users';
import { useUser } from '@/contexts/UserContext';

interface ChatHeaderProps {
  conversationId: string;
  participantIds: string[];
}

export function ChatHeader({ conversationId, participantIds }: ChatHeaderProps) {
  const { user } = useUser();
  const [counterpart, setCounterpart] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user || !participantIds) return;
      
      try {
        setLoading(true);
        const otherId = participantIds.find((id) => id !== user._id);
        if (otherId) {
          const userData = await getUserById(otherId);
          if (mounted) setCounterpart(userData);
        }
      } catch (error) {
        console.error('Failed to fetch counterpart user:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    
    return () => { mounted = false; };
  }, [user?._id, participantIds]);

  if (loading) {
    return (
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
        </div>
      </div>
    );
  }

  if (!counterpart) {
    return (
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
          ?
        </div>
        <div className="flex-1">
          <div className="font-medium text-gray-900">Unknown User</div>
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'seller':
        return 'bg-green-100 text-green-800';
      case 'buyer':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'seller':
        return 'Seller';
      case 'buyer':
        return 'Buyer';
      case 'admin':
        return 'Admin';
      default:
        return role;
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
      <div className="relative">
        {counterpart.avatar ? (
          <img
            src={counterpart.avatar}
            alt={counterpart.displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-medium">
            {counterpart.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        {counterpart.isVerified && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 truncate">{counterpart.displayName}</h3>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(counterpart.role)}`}>
            {getRoleLabel(counterpart.role)}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {counterpart.city && counterpart.neighborhood 
            ? `${counterpart.neighborhood}, ${counterpart.city}`
            : counterpart.city || counterpart.neighborhood || 'Location not set'
          }
        </div>
      </div>
    </div>
  );
}