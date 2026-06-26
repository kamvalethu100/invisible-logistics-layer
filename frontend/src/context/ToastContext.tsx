'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'notification';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (title: string, message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((title: string, message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm">
        {toasts.map((t) => (
          <div 
            key={t.id}
            className={cn(
              "bg-white border rounded-xl shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-right-full duration-300",
              t.type === 'success' && "border-green-100 bg-green-50/50",
              t.type === 'error' && "border-red-100 bg-red-50/50",
              t.type === 'notification' && "border-blue-100 bg-blue-50/50"
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-gray-600" />}
              {t.type === 'notification' && <Bell className="w-5 h-5 text-blue-600" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight">{t.title}</p>
              <p className="text-xs text-gray-600 mt-1">{t.message}</p>
            </div>
            
            <button 
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
