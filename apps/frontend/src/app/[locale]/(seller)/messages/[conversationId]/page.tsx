'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { listConversations, listMessages, sendMessage, markRead } from '@/app/api/messages';
import { useSocket } from '@/app/hooks/useSocket';
import { ConversationsList, ChatHeader } from '@/components/business';

interface Msg {
  _id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export default function SellerChat() {
  const { user, isLoaded } = useUser();
  const { conversationId, locale } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<any>(null);
  const topRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const socketRef = useSocket((socket) => {
    socket.on('connect', () => {
      if (conversationId) {
        socket.emit('conversation:join', { conversationId });
      }
    });
    socket.on('message:new', (msg: any) => {
      if (user?._id && String(msg.senderId) === String(user._id)) return;
      const isSameConversation = String(msg.conversationId) === String(conversationId);
      if (isSameConversation) {
        setMessages((prev) => {
          const next = prev.some((m) => m._id === msg._id) ? prev : [...prev, msg];
          setTimeout(scrollToBottom, 0);
          return next;
        });
      } else {
        listConversations(1, 30).then((res) => setConversations(res.data || [])).catch(() => {});
      }
    });
    socket.on('unread:total', () => {
      listConversations(1, 30).then((res) => setConversations(res.data || [])).catch(() => {});
    });
    socket.on('message:read', ({ conversationId: cid, userId }: any) => {
      // could update per-message read indicators later
    });
  });

  useEffect(() => {
    if (!conversationId) return;
    socketRef.current?.emit('conversation:join', { conversationId });
    return () => {
      socketRef.current?.emit('conversation:leave', { conversationId });
    };
  }, [conversationId]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user || user.role !== 'seller') {
      router.replace(`/${locale}/overview`);
      return;
    }
    // Load conversations for seller
    (async () => {
      try {
        setLoadingConvos(true);
        const res = await listConversations(1, 30);
        setConversations(res.data || []);
        // Find current conversation
        const current = res.data?.find(c => c._id === conversationId);
        setCurrentConversation(current);
      } finally {
        setLoadingConvos(false);
      }
    })();

    // Load messages for active conversation
    (async () => {
      try {
        setLoading(true);
        const res = await listMessages(conversationId as string, 1, 30);
        setMessages(res.data);
        setPage(1);
        setHasPrev(res.pagination.hasPrev);
        try { await markRead(conversationId as string); } catch {}
        setTimeout(scrollToBottom, 0);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, user, conversationId, router, locale]);

  const loadOlder = async () => {
    const nextPage = page + 1;
    const res = await listMessages(conversationId as string, nextPage, 30);
    setMessages((prev) => [...res.data, ...prev]);
    setPage(nextPage);
    setHasPrev(res.pagination.hasPrev);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const optimistic: Msg = {
      _id: `tmp-${Date.now()}`,
      senderId: user._id,
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => {
      const next = [...prev, optimistic];
      setTimeout(scrollToBottom, 0);
      return next;
    });
    setText('');
    try {
      const saved = await sendMessage(conversationId as string, optimistic.text);
      setMessages((prev) => prev.map(m => m._id === optimistic._id ? saved : m));
    } catch {
      setMessages((prev) => prev.filter(m => m._id !== optimistic._id));
    }
  };

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations list */}
        <div className="hidden lg:flex bg-white rounded-xl shadow-sm border border-gray-200 flex-col min-h-[500px] max-h-[calc(100vh-200px)]">
          <div className="px-4 py-3 border-b border-gray-200 font-semibold flex-shrink-0">Conversations</div>
          <div className="flex-1 overflow-y-auto">
            <ConversationsList conversations={conversations} loading={loadingConvos} onSelect={(id) => router.replace(`/${locale}/messages/${id}`)} activeId={conversationId} />
          </div>
        </div>

        {/* Chat pane */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[500px] max-h-[calc(100vh-200px)]">
          {/* Chat Header */}
          {currentConversation && (
            <ChatHeader 
              role={user?.role === 'seller' ? 'buyer' : 'seller'}
              conversationId={conversationId as string} 
              participantIds={currentConversation.participantIds} 
            />
          )}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {hasPrev && (
              <div ref={topRef} className="text-center py-2">
                <button onClick={loadOlder} className="text-blue-600 text-sm hover:underline">Load earlier messages</button>
              </div>
            )}
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading...</div>
            ) : (
              messages.map((m) => {
                const isMine = m.senderId === user?._id;
                return (
                  <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${isMine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                      <div>{m.text}</div>
                      <div className="text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-gray-200 p-3 flex items-center gap-2 flex-shrink-0">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

