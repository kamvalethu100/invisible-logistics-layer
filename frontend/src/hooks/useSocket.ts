'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';

export function useSocket() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (user) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
        auth: { token },
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  return socket;
}
