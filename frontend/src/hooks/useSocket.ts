'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

export function useSocket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (user) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
        auth: { token },
        reconnectionAttempts: 5,
        timeout: 10000,
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        setConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.warn('Socket disconnected:', reason);
        setConnected(false);
        if (reason === 'io server disconnect' || reason === 'transport close') {
           toast('Connection Lost', 'Live updates are currently unavailable. Retrying...', 'error');
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setConnected(false);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  return { socket, connected };
}
