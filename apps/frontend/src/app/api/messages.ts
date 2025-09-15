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

import { messagesApiClient } from '@/app/lib/apiClient';
import { apiErrorHandler } from '@/app/lib/apiErrorHandler';

export async function getOrCreateConversation(params: { buyerId?: string; sellerId?: string; listingId?: string }) {
  try {
    const response = await messagesApiClient.post('/conversations', params);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function listConversations(page = 1, limit = 20) {
  try {
    const response = await messagesApiClient.get(`/conversations?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function listMessages(conversationId: string, page = 1, limit = 20) {
  try {
    const response = await messagesApiClient.get(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function sendMessage(conversationId: string, text: string) {
  try {
    const response = await messagesApiClient.post(`/conversations/${conversationId}/messages`, { text });
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function markRead(conversationId: string) {
  try {
    const response = await messagesApiClient.post(`/conversations/${conversationId}/messages/read`);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function getUnreadTotal() {
  try {
    const response = await messagesApiClient.get('/conversations/unread-count');
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

