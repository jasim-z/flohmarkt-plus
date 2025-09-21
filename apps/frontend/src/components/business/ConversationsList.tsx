'use client';

import { useEffect, useState } from 'react';
import { getUserById } from '@/app/api/users';
import { useUser } from '@/contexts/UserContext';

export interface ConversationListItem {
  _id: string;
  participantIds: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export function ConversationsList({
  conversations,
  loading,
  onSelect,
  activeId,
}: {
  conversations: ConversationListItem[];
  loading: boolean;
  onSelect: (id: string) => void;
  activeId?: string | string[];
}) {
  const { user } = useUser();
  const [enriched, setEnriched] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      if (!conversations || conversations.length === 0) {
        if (mounted) setEnriched([]);
        return;
      }
      const mapped = await Promise.all(
        conversations.map(async (c) => {
          const otherId = c.participantIds.find((id) => id !== user._id);
          let counterpart: any = null;
          try { counterpart = otherId ? await getUserById(otherId) : null; } catch {}
          // unread badge heuristic: if lastMessage exists and last message not sent by me
          const unread = c.lastMessage && counterpart ? true : false;
          return { ...c, counterpart, unread };
        })
      );
      if (mounted) setEnriched(mapped);
    })();
    return () => { mounted = false; };
  }, [conversations, user?._id]);

  if (loading) return <div className="p-4 text-sm text-gray-500">Loading...</div>;
  if (!enriched || enriched.length === 0) return <div className="p-4 text-sm text-gray-500">No conversations yet.</div>;

  const active = Array.isArray(activeId) ? activeId.join() : activeId;

  return (
    <div className="max-h-[70vh] overflow-y-auto">
      {enriched.map((c) => (
        <button
          key={c._id}
          onClick={() => onSelect(c._id)}
          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0 ${c._id === active ? 'bg-gray-50' : ''}`}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
              {(c.counterpart?.displayName || 'U').charAt(0)}
            </div>
            {!!c.unreadCount && c.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center">
                {c.unreadCount}
              </span>
            )}
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

