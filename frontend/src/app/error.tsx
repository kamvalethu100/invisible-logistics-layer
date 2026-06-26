'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-lg w-full text-center border border-slate-100">
        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
        <p className="text-slate-500 mb-8">
          We encountered an unexpected error. This has been logged, and we're looking into it.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => reset()}
            className="flex-1 gap-2 h-12"
          >
            <RefreshCcw className="w-4 h-4" />
            Try again
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="flex-1 gap-2 h-12"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>
        
        {error.digest && (
          <p className="mt-8 text-[10px] text-slate-300 font-mono uppercase tracking-widest">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
