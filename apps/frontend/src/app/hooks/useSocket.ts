'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(onEvents?: (socket: Socket) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_MESSAGES_WS_URL || process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:3954';
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    const socket = io(base, {
      transports: ['websocket'],
      autoConnect: true,
      // Socket.IO browser clients cannot set custom headers. Use auth/query instead.
      auth: token ? { token } : undefined,
      query: token ? { token } : undefined,
    });
    socketRef.current = socket;
    if (onEvents) onEvents(socket);
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef;
}

