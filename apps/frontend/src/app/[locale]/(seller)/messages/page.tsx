"use client";

import { useTranslations } from "next-intl";
import UnAuthourized from "@/components/UnAuthourized";
import { useUser } from "@/contexts/UserContext";
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { listConversations } from '@/app/api/messages';
import { ConversationsList } from '@/components/business';
import { useSocket } from '@/hooks/useSocket';

export default function SellerMessages() {
  const t = useTranslations();
  const { role, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  useSocket((socket) => {
    socket.on('message:new', () => {
      listConversations(1, 50).then((res) => setConversations(res.data || [])).catch(() => {});
    });
    socket.on('unread:total', () => {
      listConversations(1, 50).then((res) => setConversations(res.data || [])).catch(() => {});
    });
  });

  // Load conversations once (or when auth loaded)
  useEffect(() => {
    (async () => {
      if (!isLoaded) return;
      try {
        setLoadingConvos(true);
        const res = await listConversations(1, 50);
        setConversations(res.data || []);
      } finally {
        setLoadingConvos(false);
      }
    })();
  }, [isLoaded]);

  if (role !== 'seller' && isLoaded) return <UnAuthourized />;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="loader border-4 border-blue-600 border-t-transparent rounded-full w-12 h-12 mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  const convoId = search.get('conversationId');
  if (convoId) {
    router.replace(`/${params.locale}/messages/${convoId}`);
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
            <p className="text-gray-600">View and manage your messages</p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] max-h-[calc(100vh-300px)] flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 font-semibold flex-shrink-0">Conversations</div>
          <div className="flex-1 overflow-y-auto">
            <ConversationsList 
              conversations={conversations}
              loading={loadingConvos}
              onSelect={(id) => router.push(`/${params.locale}/messages/${id}`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 
