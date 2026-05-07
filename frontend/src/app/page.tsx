'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'business') {
        router.push('/business/dashboard');
      } else {
        router.push('/driver/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm flex flex-col text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-blue-600">Invisible Logistics Layer</h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl">
          Empowering small businesses with instant, reliable delivery coordination.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">For Businesses</h2>
          <p className="text-gray-600 mb-8 flex-grow">
            Request deliveries in seconds, track them in real-time, and grow your customer reach.
          </p>
          <div className="flex flex-col gap-3">
            <Link 
              href="/auth/login"
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-center hover:bg-blue-700 transition-colors"
            >
              Business Login
            </Link>
            <Link 
              href="/auth/register"
              className="w-full py-3 border border-blue-600 text-blue-600 rounded-lg font-bold text-center hover:bg-blue-50 transition-colors"
            >
              Register Business
            </Link>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">For Drivers</h2>
          <p className="text-gray-600 mb-8 flex-grow">
            Find local delivery jobs, manage your schedule, and earn on your terms.
          </p>
          <div className="flex flex-col gap-3">
            <Link 
              href="/auth/login"
              className="w-full py-3 bg-green-600 text-white rounded-lg font-bold text-center hover:bg-green-700 transition-colors"
            >
              Driver Login
            </Link>
            <Link 
              href="/auth/register"
              className="w-full py-3 border border-green-600 text-green-600 rounded-lg font-bold text-center hover:bg-green-50 transition-colors"
            >
              Register as Driver
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
