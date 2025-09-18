'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ConversationsList } from '@/components/business';
import { listConversations } from '@/app/api/messages';
import { useSocket } from '@/hooks/useSocket';

export default function BuyerMessages() {
  const { user, isLoaded, isLoading: authLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const search = useSearchParams();
  useSocket((socket) => {
    socket.on('message:new', () => {
      listConversations(1, 50).then((res) => setConversations(res.data || [])).catch(() => {});
    });
    socket.on('unread:total', () => {
      listConversations(1, 50).then((res) => setConversations(res.data || [])).catch(() => {});
    });
  });

  // Check authentication
  if (isLoaded && !authLoading) {
    if (!user) {
      router.replace(`/${params.locale}/login`);
      return null;
    } else if (user.role === 'seller') {
      router.replace(`/${params.locale}/overview`);
      return null;
    } else if (user.role === 'admin') {
      router.replace(`/${params.locale}/dashboard`);
      return null;
    }
  }

  if (authLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Deep link to conversation if provided
  const convoId = search.get('conversationId');
  if (convoId) {
    router.replace(`/${params.locale}/user-messages/${convoId}`);
    return null;
  }

  // Load conversations for buyer
  useEffect(() => {
    (async () => {
      if (!user || user.role !== 'buyer') return;
      try {
        setLoadingConvos(true);
        const res = await listConversations(1, 50);
        setConversations(res.data || []);
      } finally {
        setLoadingConvos(false);
      }
    })();
  }, [user?._id, isLoaded]);

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Messages
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Communicate with sellers about items, negotiate prices, and coordinate pickups.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] max-h-[calc(100vh-300px)] flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 font-semibold flex-shrink-0">Conversations</div>
          <div className="flex-1 overflow-y-auto">
            <ConversationsList
              conversations={conversations}
              loading={loadingConvos}
              onSelect={(id) => router.push(`/${params.locale}/user-messages/${id}`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 