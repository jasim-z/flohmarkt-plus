"use client";

import { useTranslations } from "next-intl";
import UnAuthourized from "@/app/components/UnAuthourized";
import { useUser } from "@/contexts/UserContext";
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { listConversations } from '@/app/api/messages';
import { ConversationsList } from '@/app/components/ConversationsList';
import { useSocket } from '@/app/hooks/useSocket';

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">View and manage your messages</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 font-semibold">Conversations</div>
          <ConversationsList 
            conversations={conversations}
            loading={loadingConvos}
            onSelect={(id) => router.push(`/${params.locale}/messages/${id}`)}
          />
        </div>
      </div>
    </div>
  );
} 
