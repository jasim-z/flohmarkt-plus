export interface Conversation {
  _id: string;
  participantIds: string[];
  listingId?: string;
  marketId?: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
}

export async function getOrCreateConversation(params: { buyerId?: string; sellerId?: string; listingId?: string }) {
  const base = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:3954';
  const resp = await fetch(`${base}/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify(params),
  });
  if (!resp.ok) throw new Error('Failed to get conversation');
  return resp.json();
}

export async function listConversations(page = 1, limit = 20) {
  const base = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:3954';
  const resp = await fetch(`${base}/conversations?page=${page}&limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
  });
  if (!resp.ok) throw new Error('Failed to load conversations');
  return resp.json();
}

export async function listMessages(conversationId: string, page = 1, limit = 20) {
  const base = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:3954';
  const resp = await fetch(`${base}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
  });
  if (!resp.ok) throw new Error('Failed to load messages');
  return resp.json();
}

export async function sendMessage(conversationId: string, text: string) {
  const base = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:3954';
  const resp = await fetch(`${base}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify({ text }),
  });
  if (!resp.ok) throw new Error('Failed to send message');
  return resp.json();
}

export async function markRead(conversationId: string) {
  const base = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:3954';
  const resp = await fetch(`${base}/conversations/${conversationId}/messages/read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
  });
  if (!resp.ok) throw new Error('Failed to mark read');
  return resp.json();
}

