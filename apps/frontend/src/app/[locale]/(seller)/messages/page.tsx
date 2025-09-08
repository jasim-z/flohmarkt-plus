"use client";

import { useTranslations } from "next-intl";
import UnAuthourized from "@/app/components/UnAuthourized";
import { useUser } from "@/contexts/UserContext";
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { listConversations } from '@/app/api/messages';
import { getUserById } from '@/app/api/users';

export default function SellerMessages() {
  const t = useTranslations();
  const { role, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);

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

function ConversationsList({ conversations, loading, onSelect }: { conversations: any[]; loading: boolean; onSelect: (id: string) => void }) {
  const { user } = useUser();
  const [enriched, setEnriched] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) return;
      if (!conversations || conversations.length === 0) {
        setEnriched([]);
        return;
      }
      const mapped = await Promise.all(conversations.map(async (c: any) => {
        const otherId = (c.participantIds as string[]).find((id) => id !== user._id);
        let counterpart: any = null;
        try { counterpart = otherId ? await getUserById(otherId) : null; } catch {}
        return { ...c, counterpart };
      }));
      if (alive) setEnriched(mapped);
    })();
    return () => { alive = false; };
  }, [conversations, user?._id]);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  }
  if (!enriched || enriched.length === 0) {
    return <div className="p-6 text-sm text-gray-500">No conversations yet.</div>;
  }

  return (
    <div>
      {enriched.map((c) => (
        <button
          key={c._id}
          onClick={() => onSelect(c._id)}
          className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0"
        >
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
            {(c.counterpart?.displayName || 'U').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-900 truncate">{c.counterpart?.displayName || 'Conversation'}</div>
              <div className="text-xs text-gray-500">{c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : ''}</div>
            </div>
            <div className="text-xs text-gray-500 truncate">{c.lastMessage || 'No messages yet'}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

// Load conversations on page mount
function useLoadConversations(setter: (c: any[]) => void, setLoading: (v: boolean) => void) {
  const { isLoaded } = useUser();
  useEffect(() => {
    (async () => {
      if (!isLoaded) return;
      try {
        setLoading(true);
        const res = await listConversations(1, 50);
        setter(res.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, setter, setLoading]);
}

function ConversationsLoader({ onLoad, onLoading }: { onLoad: (items: any[]) => void; onLoading: (v: boolean) => void }) {
  useLoadConversations(onLoad, onLoading);
  return null;
}
